/*!
 * .______    _______     ___      .______       ______     ___   .__________.
 * (   _  )  (   ____)   /   \     (   _  )     (      )   /   \  (          )
 * |  |_)  ) |  |__     /  ^  \    |  |_)  )   |  ,----'  /  ^  \ `---|  |---`
 * |   _  <  |   __)   /  /_\  \   |      )    |  |      /  /_\  \    |  |
 * |  |_)  ) |  |____ /  _____  \  |  |)  ----.|  `----./  _____  \   |  |
 * (______)  (_______/__/     \__\ ( _| `.____) (______)__/     \__\  |__|
 *
 * Bearcat-ha ZookeeperClient
 * Copyright(c) 2015 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

var logger = require('pomelo-logger').getLogger('bearcat-ha', 'ZookeeperClient');
var WatcherLock = require('../watcher/watcherLock');
var ZooKeeper = require("node-zookeeper-client");
var zkCreateMode = ZooKeeper.CreateMode;
var crypto = require('crypto');
var zkEvent = ZooKeeper.Event;
var async = require('async');

var WATCHER_SESSION_TIMEOUT = 5000;

function ZookeeperClient(opts, callback) {
  this.servers = opts.servers;
  this.chroot = opts.chroot || '';
  this.username = opts.username;
  this.password = opts.password;
  this.sessionTimeout = opts.sessionTimeout || WATCHER_SESSION_TIMEOUT;
  this.client = null;
  this.init(callback);
}

ZookeeperClient.prototype.init = function(callback) {
  callback = callback || function() {};

  var chroot = this.chroot;
  var servers = this.servers;
  var username = this.username;
  var password = this.password;
  var sessionTimeout = this.sessionTimeout;

  this.client = ZooKeeper.createClient(servers + chroot, {
    sessionTimeout: sessionTimeout
  });

  var timeout = setTimeout(function() {
    logger.error('connect to zookeeper timeout!');
  }, 15000);

  var self = this;

  this.client.once('connected', function() {
    clearTimeout(timeout);
    if (username) {
      logger.debug('addAuthInfo %s %s', username, password);
      self.client.addAuthInfo('digest', new Buffer(username + ':' + password));
    }
    callback();
  });

  this.client.on('connected', function() {
    logger.info('Connected to the zookeeper server');
  });

  this.client.on('disconnected', function() {
    logger.error('Disconnected to zookeeper server');
    throw new Error('Disconnected to zookeeper server');
  });

  this.client.connect();
}

ZookeeperClient.prototype.close = function() {
  this.client.close();
  this.client.removeAllListeners();
  this.client = null;
};

ZookeeperClient.prototype.watchNode = function(path, watcher) {
  this.client.exists(path, watcher, function(err, stat) {
    if (err) {
      logger.error('watchNode error ' + path + ' ' + err.stack);
    }

    if (!stat) {
      logger.warn('Watch path not exists! path: %s', path);
    }
  });
};

ZookeeperClient.prototype.setData = function(path, value, callback) {
  var str = '';
  try {
    str = JSON.stringify(value);
  } catch (error) {
    logger.error('setData error ' + error.stack);
  }
  this.client.setData(path, new Buffer(str), callback);
};

ZookeeperClient.prototype.getData = function(path, watcher, callback) {
  this.client.getData(path, watcher, callback);
};

ZookeeperClient.prototype.watchData = function(path, watcher) {
  var self = this;
  this.client.getData(path, function(event) {
    if (event.type == zkEvent.NODE_DATA_CHANGED) {
      self.getData(path, function(err, data) {
        if (err) {
          logger.error('watchData getData error ' + err.stack);
        }

        try {
          data = JSON.parse(data.toString());
        } catch (e) {
          logger.error('watchData getData parse data error ' + e.stack);
          data = null;
        }
        watcher(data);
      });
    }
  }, function(err) {
    if (err) {
      logger.error('watchData getData error ' + err.stack);
    }
  });
};

ZookeeperClient.prototype.getACL = function() {
  // return;
  if (!this.username || !this.password) {
    return null;
  }

  var authentication = this.username + ':' + this.password;
  var shaDigest = crypto.createHash('sha1').update(authentication).digest('base64');
  return [new ZooKeeper.ACL(ZooKeeper.Permission.ALL, new ZooKeeper.Id('digest', this.username + ':' + shaDigest))];
}

ZookeeperClient.prototype.createLock = function(path, callback) {
  return new WatcherLock(this.client, path, this.getACL(), callback);
};

ZookeeperClient.prototype.createEphemeral = function(path, callback) {
  this.client.create(path, this.getACL(), zkCreateMode.EPHEMERAL, callback);
};

ZookeeperClient.prototype.createPathBatch = function(paths, callback) {
  var self = this;
  async.eachSeries(paths, function(item, next) {
    self.client.mkdirp(item, self.getACL(), zkCreateMode.PERSISTENT, function(err) {
      if (err) {
        logger.error('create %s path error: %s', item, err.stack);
        return next(err);
      }

      logger.info('create %s path success!', item);
      next();
    });
  }, callback);
};

ZookeeperClient.prototype.getChildrenData = function(path, callback) {
  var self = this;
  self.client.getChildren(path, function(err, children) {
    if (err) {
      return callback(err);
    }

    var data = [];
    async.each(children, function(item, next) {
      self.client.getData(path + "/" + item, function(err, result) {
        if (err) {
          logger.error('getChildrenData getData error ' + err.stack);
          return next(err);
        }

        if (result) {
          data.push(JSON.parse(result));
        }
        next();
      });
    }, function(err) {
      callback(err, data);
    });
  });
};

// module.exports = ZookeeperClient;
var instance = null;

exports.createClient = function(opts, callback) {
  if (!instance) {
    instance = new ZookeeperClient(opts, callback);
  }

  return instance;
};