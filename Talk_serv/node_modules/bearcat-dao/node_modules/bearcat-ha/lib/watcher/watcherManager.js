/*!
 * .______    _______     ___      .______       ______     ___   .__________.
 * (   _  )  (   ____)   /   \     (   _  )     (      )   /   \  (          )
 * |  |_)  ) |  |__     /  ^  \    |  |_)  )   |  ,----'  /  ^  \ `---|  |---`
 * |   _  <  |   __)   /  /_\  \   |      )    |  |      /  /_\  \    |  |
 * |  |_)  ) |  |____ /  _____  \  |  |)  ----.|  `----./  _____  \   |  |
 * (______)  (_______/__/     \__\ ( _| `.____) (______)__/     \__\  |__|
 *
 * Bearcat-ha WatcherManager
 * Copyright(c) 2015 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

var logger = require('pomelo-logger').getLogger('bearcat-ha', 'WatcherManager');
var ZookeeperClient = require('../client/zookeeperClient');
var WatcherStrategy = require('./watcherStrategy');
var EventEmitter = require('events').EventEmitter;
var Constant = require('../util/constant');
var Utils = require('../util/utils');
var async = require('async');
var Util = require('util');

var ADD_NODE_DELAY_TIME = Constant.ADD_NODE_DELAY_TIME;
var ADD_NODES_DELAY_TIME = Constant.ADD_NODES_DELAY_TIME;
var MASTER_CHECK_NODE_TIME = Constant.MASTER_CHECK_NODE_TIME;

var HOST_NAME = Utils.getHostName();
var PROCESS_PID = process.pid;

var WatcherManager = function(opts) {
    EventEmitter.call(this);
    this.opts = opts;
    this.haState = null;
    this.masterNode = null;
    this.watcherNodes = {};

    this.rootPath = Constant.ZK_DEFAULT_PATH + '/' + opts.name;
    this.locksPath = this.rootPath + '/locks';
    this.watchersPath = this.rootPath + '/watchers';
    this.watcherManagerPath = this.watchersPath + '/' + HOST_NAME + '-' + PROCESS_PID;

    this.failures = 0;
    this.zkClient = null;
    this.isMaster = false;
    this.intervalId = null;
    this.isolatedNodes = [];
    this.watcherClient = null; // setup self-defined watcher client
    this.watcherType = opts.type || Constant.WATCHER_TYPE_REDIS; // builtin ha watcher type redis or mysql
    this.readyForCollectAndUpdate = false;

    this.init();
}

Util.inherits(WatcherManager, EventEmitter);

WatcherManager.prototype.init = function() {
    var opts = this.opts;

    if (opts.addNodeDelayTime) {
        ADD_NODE_DELAY_TIME = opts.addNodeDelayTime;
    }

    if (opts.addNodesDelayTime) {
        ADD_NODES_DELAY_TIME = opts.addNodesDelayTime;
    }

    if (opts.masterCheckNodeTime) {
        MASTER_CHECK_NODE_TIME = opts.masterCheckNodeTime;
    }

    var watcherType = this.watcherType;
    if (watcherType !== Constant.WATCHER_TYPE_REDIS && watcherType !== Constant.WATCHER_TYPE_MYSQL) {
        logger.error('invalid watcherType %s', watcherType);
        return;
    }

    this.initZKClient();
};

WatcherManager.prototype.initZKClient = function() {
    var self = this;
    var opts = this.opts;

    this.zkClient = ZookeeperClient.createClient(opts.zooKeeper);
    var paths = [self.locksPath, self.watchersPath];
    self.zkClient.createPathBatch(paths, function(err) {
        if (err) {
            logger.error('init createPathBatch error: ' + err.stack);
            throw err;
        }

        self.zkClient.createEphemeral(self.watcherManagerPath, function(err) {
            if (err) {
                logger.error('init createEphemeral error: ' + err.stack);
                throw err;
            }

            self.ready();
        });
    });
}

WatcherManager.prototype.ready = function() {
    var self = this;
    this.getLock(function() {
        self.initWatcherNodes();

        if (self.checkMaster()) {
            self.startCollect();
        }
    });
};

WatcherManager.prototype.startCollect = function() {
    logger.info('startCollect watcher monitor data from slave watchers ...');
    var self = this;
    if (self.intervalId) {
        clearInterval(self.intervalId);
    }

    if (self.checkMaster()) {
        self.intervalId = setInterval(function() {
            self.collectData();
        }, MASTER_CHECK_NODE_TIME);
    }
};

WatcherManager.prototype.collectData = function() {
    if (!this.readyForCollectAndUpdate) {
        return;
    }

    var self = this;
    self.zkClient.getChildrenData(self.watchersPath, function(err, data) {
        if (err) {
            logger.error('collectData getChildrenData error ' + err.stack);
            self.failures += 1;
            if (self.failures >= 3) {
                throw err;
            }
            return;
        }

        var result = WatcherStrategy.elect(data);
        // master unavailable
        if (!self.masterNode || result.unavailable.indexOf(self.masterNode.name) > -1) {
            logger.error('master node unavailable, will promote a new one in %j ...', result.available);
            // master is unavailable
            self.masterNode = null;
            self.updateNodesInfo(function() {
                self.promoteHaMaster(result.available, 0, function() {
                    self.updateHaState(result);
                });
            });
            return;
        }

        self.updateHaState(result);
    });
};

WatcherManager.prototype.onPromote = function() {
    logger.info('Promote to watcherManager master node ...')
    this.resetWatcherNodes();
    this.startCollect();
};

// node available
WatcherManager.prototype.onAvailable = function(availableNode) {
    var self = this;
    var availableNodeName = availableNode.name;

    logger.warn('[OnAvailable] watcherNode %j', availableNode);

    // slaveManager
    if (!self.checkMaster()) {
        return this.updateData();
    }

    var masterNode = this.masterNode;
    var masterNodeName = "";
    if (masterNode) {
        masterNodeName = masterNode.name;
    }

    // masterManager
    if (masterNode) {
        if (availableNodeName !== masterNodeName && availableNode.master != masterNodeName) {
            availableNode.slaveOf(masterNode, function(err) {
                if (err) {
                    logger.error('%s slave of %s fail, reason: %s', availableNodeName, masterNodeName, err.stack);
                    throw err;
                } else {
                    logger.info('watcherNode onAvailable %s slave of %s success ...', availableNodeName, masterNodeName);
                }
            });
        }
    } else if (availableNode.checkMaster()) {
        // availableNode is master node
        masterNode = availableNode;
        logger.info('watcherNode onAvailable setMasterNode %j', masterNode);
        self.setMasterNode(masterNode);
        // self.masterNode = availableNode;
        async.eachSeries(self.isolatedNodes, function(n, next) {
            var isolatedNode = self.watcherNodes[n];
            if (!isolatedNode || isolatedNode.master == masterNode.name) {
                return next();
            }

            isolatedNode.slaveOf(masterNode, function(err) {
                if (err) {
                    logger.error('%s slave of %s fail, reason: %s', isolatedNode.name, masterNode.name, err.stack);
                    throw err;
                } else {
                    logger.info('%s slave of %s success ...', isolatedNode.name, masterNode.name);
                }
                next();
            });
        }, function() {
            self.isolatedNodes = [];
        });
    } else {
        logger.warn('watcherNode onAvailable add isolatedNode %j', availableNode);
        // availableNode is slave node
        // this scene occurs when this slave node available quickly than master node
        self.isolatedNodes.push(availableNodeName);
    }

    this.updateData();
};

// node unavailable
WatcherManager.prototype.onUnavailable = function(unavailableNode) {
    var unavailableNodeName = unavailableNode.name;
    logger.warn('[OnUnavailable] watcherNode %j', unavailableNode);

    this.removeWatcherNode(unavailableNodeName);
    this.addWatcherNode(unavailableNode.opts);

    this.updateData();

    if (this.checkMaster()) {
        this.collectData();
    }
};

WatcherManager.prototype.addWatcherNode = function(opts) {
    var watcherNode = this.getWatcherClient(opts);
    var watcherNodeName = watcherNode.name;

    watcherNode.on('available', this.onAvailable.bind(this));
    watcherNode.on('unavailable', this.onUnavailable.bind(this));

    this.setWatcherNode(watcherNodeName, watcherNode);

    logger.info('[AddWatcherNode] %j', watcherNode);
};

WatcherManager.prototype.removeWatcherNode = function(name) {
    logger.info('[RemoveWatcherNode] %s', name);
    var watcherNode = this.getWatcherNode(name);
    watcherNode.close();
    watcherNode = null;
    delete this.watcherNodes[name];
};

WatcherManager.prototype.initWatcherNodes = function() {
    var self = this;
    var watcherServers = this.opts.servers.split(',');

    async.eachSeries(watcherServers, function(server, next) {
        var serverData = server.split(':');
        var host = serverData[0];
        var port = serverData[1];
        var opts = self.getClonedOpts(self.opts);
        opts['host'] = host;
        opts['port'] = port;
        opts['name'] = server;
        self.addWatcherNode(opts);
        setTimeout(next, ADD_NODE_DELAY_TIME);
    }, function() {
        setTimeout(function() {
            logger.info('ready for update data to zookeeper!');
            self.readyForCollectAndUpdate = true;
            self.updateData();
        }, ADD_NODES_DELAY_TIME);
    });
};

WatcherManager.prototype.close = function() {
    for (var name in this.watcherNodes) {
        this.removeWatcherNode(name);
    }
    this.zkClient.close();
    this.zkClient = null;
};

WatcherManager.prototype.resetWatcherNodes = function(opts) {
    logger.warn('[Reset] masterWatcher reset all watcherNodes');
    this.readyForCollectAndUpdate = false;
    if (opts) {
        this.opts = opts;
    }

    for (var name in this.watcherNodes) {
        this.removeWatcherNode(name);
    }

    this.initWatcherNodes();
};

WatcherManager.prototype.promoteHaMaster = function(availableNodes, index, callback) {
    var self = this;
    if (this.masterNode && this.masterNode.available) {
        return callback();
    }

    index = index || 0;

    if (index >= availableNodes.length) {
        logger.error('no availableNodes %j can be promoted to be Master!', availableNodes);
        if (availableNodes.length) {
            throw new Error('[Promote] master watcher fail to promoteHaMaster for current availableNodes');
        } else {
            return callback();
        }
    }

    var readyPromoteNodeName = availableNodes[index];
    var readyPromoteNode = this.getWatcherNode(readyPromoteNodeName);
    logger.info('[Promote] new haMaster %j current availableNodes: %j', readyPromoteNode, availableNodes);

    if (!readyPromoteNode || !readyPromoteNode.available || !readyPromoteNode.ready) {
        return self.promoteHaMaster(availableNodes, index + 1, callback);
    }

    readyPromoteNode.makeMaster(function(err) {
        if (err) {
            logger.error('promoteHaMaster make %s to master error %s', readyPromoteNode.name, err.stack);
            throw err;
        }

        var masterNode = readyPromoteNode;
        var masterNodeName = masterNode.name;
        self.setMasterNode(masterNode);

        logger.info('[Promote] make %s to master success!', readyPromoteNode.name);

        availableNodes.splice(index, 1);
        async.each(availableNodes, function(name, next) {
            var slaveNode = availableNodes[name];
            if (!slaveNode) {
                return next();
            }

            slaveNode.slaveOf(masterNode, function(err) {
                if (err) {
                    logger.error('%s slave to master: %s error: %s', name, masterNodeName, err.stack);
                    throw err;
                } else {
                    logger.info('[Promote] %s slave to master: %s success', name, masterNodeName);
                }
                next();
            });
        }, function() {
            logger.info('[Promote] a new master: %s success', masterNodeName);
            callback();
        });
    });
};

// update ha state to zookeeper
WatcherManager.prototype.updateData = function() {
    if (!this.readyForCollectAndUpdate) {
        return;
    }

    var available = [];
    var unavailable = [];

    for (var name in this.watcherNodes) {
        var watcherNode = this.getWatcherNode(name);
        if (watcherNode.checkAvailable()) {
            available.push(name);
        } else {
            unavailable.push(name);
        }
    }

    logger.info('[UpdateData ManagerPath] available: %j, unavailable: %j', available, unavailable);
    this.zkClient.setData(this.watcherManagerPath, {
        available: available,
        unavailable: unavailable
    }, function(err) {
        if (err) {
            logger.error('updateData zkClient setData error ' + err.stack);
            throw err;
        }
    });
};

WatcherManager.prototype.updateNodesInfo = function(callback) {
    var self = this;
    var names = Object.keys(self.watcherNodes);
    async.each(names, function(name, next) {
        var watcherNode = self.getWatcherNode(name);
        if (watcherNode.checkAvailable()) {
            return watcherNode.updateInfo(next);
        }

        next();
    }, callback);
};

// master update the elect result to zookeeper
WatcherManager.prototype.updateHaState = function(data) {
    if (!this.checkMaster()) {
        return;
    }

    if (data.available.length === 0) {
        var haState = {
            master: null,
            slaves: [],
            unavailable: data.unavailable
        };
        return this.setState(haState);
    }

    var self = this;
    var masterNode = this.masterNode;
    var masterNodeName = "";
    if (masterNode) {
        masterNodeName = masterNode.name;
    }

    self.updateNodesInfo(function() {
        var slaves = [];
        data.available.forEach(function(name) {
            if (name == masterNodeName) {
                return;
            }

            var watcherNode = self.watcherNodes[name];
            if (!watcherNode) {
                return;
            }

            var watcherNodeMaster = watcherNode.getMaster();
            var watcherNodeMasterStatus = watcherNode.getMasterStatus();

            if (!watcherNode.checkAvailable()) {
                throw new Error('[UpdateHaState] elect available node is unavailable for masterWatcher, masterWatcher is outdated ' + JSON.stringify(watcherNode));
            }

            if (watcherNodeMasterStatus && (watcherNodeMaster === masterNodeName || watcherNodeMaster === 'MASTER')) {
                // elect available node already a slave of current master node
                slaves.push(name);
            } else {
                if (masterNode && masterNodeName) {
                    // do elect available node slaveof current master node
                    logger.info('[Slaveof] elect available node %j slaveof current master node %j', watcherNode, masterNode);
                    watcherNode.slaveOf(masterNode, function(err) {
                        if (err) {
                            logger.error('%s slave of %s fail, reason: %s', name, masterNodeName, err.stack);
                            throw err;
                        } else {
                            logger.info('%s slave of %s success ...', name, masterNodeName);
                        }
                    });
                } else {
                    // no this case, invoke updateHaState the condition is that masterNode is available
                }
            }
        });

        var haState = {
            master: masterNodeName,
            slaves: slaves,
            unavailable: data.unavailable
        };

        self.setState(haState);
    });
};

WatcherManager.prototype.setState = function(state) {
    if (!this.checkStateChange(state)) {
        return;
    }

    this.haState = state;

    this.zkClient.setData(this.rootPath, this.haState, function(err) {
        if (err) {
            logger.error('setState zkClient setData error ' + err.stack);
            throw err;
        }

        logger.info('update ha state success!, state: %j', state);
    });
};

//check the result to local haState
WatcherManager.prototype.checkStateChange = function(state) {
    var oldState = this.haState;
    if (!oldState || oldState.master != state.master) {
        return true;
    }

    if (oldState.slaves.length !== state.slaves.length) {
        return true;
    }

    if (oldState.unavailable.length !== state.unavailable.length) {
        return true;
    }

    return false;
};

WatcherManager.prototype.getLock = function(callback) {
    var self = this;
    self.zkClient.createLock(self.locksPath, function(err, lock) {
        if (err) {
            logger.error('getLock zkClient createLock error ' + err.stack);
            callback(err);
            throw err;
        }

        self.lock = lock;
        self.setMaster(lock.checkMaster());

        self.lock.on('promote', function() {
            if (!self.checkMaster()) {
                self.setMaster(true);
                self.onPromote();
            }
        });

        logger.info('[GetLock] create lock success, this is %s monitor ...', self.checkMaster() ? 'master' : 'spare');
        callback();
    });
};

WatcherManager.prototype.setWatcherClient = function(watcherClient) {
    this.watcherClient = watcherClient;
}

WatcherManager.prototype.getWatcherClient = function(opts) {
    var WatcherClient = this.watcherClient;
    if (WatcherClient) {
        return new watcherClient();
    }

    var watcherType = this.watcherType;
    WatcherClient = require('../client/' + watcherType + "Client");
    watcherClient = new WatcherClient(opts);

    return watcherClient;
}

WatcherManager.prototype.setWatcherNode = function(name, watcherNode) {
    this.watcherNodes[name] = watcherNode;
}

WatcherManager.prototype.getWatcherNode = function(name) {
    return this.watcherNodes[name];
}

WatcherManager.prototype.setMasterNode = function(masterNode) {
    this.masterNode = masterNode;
}

WatcherManager.prototype.checkMaster = function() {
    return this.isMaster;
}

WatcherManager.prototype.setMaster = function(isMaster) {
    this.isMaster = isMaster;
}

WatcherManager.prototype.getClonedOpts = function() {
    var opts = this.opts;
    var r = {
        user: opts.user,
        password: opts.password,
        pingInterval: opts.pingInterval,
        pingTimeout: opts.pingTimeout,
        maxFailures: opts.maxFailures
    };

    return r;
}

module.exports = WatcherManager;