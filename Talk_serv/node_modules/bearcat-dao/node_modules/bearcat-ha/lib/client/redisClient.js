/*!
 * .______    _______     ___      .______       ______     ___   .__________.
 * (   _  )  (   ____)   /   \     (   _  )     (      )   /   \  (          )
 * |  |_)  ) |  |__     /  ^  \    |  |_)  )   |  ,----'  /  ^  \ `---|  |---`
 * |   _  <  |   __)   /  /_\  \   |      )    |  |      /  /_\  \    |  |
 * |  |_)  ) |  |____ /  _____  \  |  |)  ----.|  `----./  _____  \   |  |
 * (______)  (_______/__/     \__\ ( _| `.____) (______)__/     \__\  |__|
 *
 * Bearcat-ha RedisClient
 * Copyright(c) 2015 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

var logger = require('pomelo-logger').getLogger('bearcat-ha', 'RedisClient');
var EventEmitter = require('events').EventEmitter;
var Constant = require('../util/constant');
var redis = require('redis');
var Util = require('util');

var RedisClient = function(opts) {
	EventEmitter.call(this);
	this.opts = opts;
	this.host = opts.host;
	this.port = opts.port;
	this.maxFailures = opts.maxFailures || Constant.REDIS_MAX_FAILURES;
	this.pingTimeout = opts.pingTimeout || Constant.REDIS_PING_TIMEOUT;
	this.queryTimeout = opts.queryTimeout || Constant.REDIS_QUERY_TIMEOUT;
	this.pingInterval = opts.pingInterval || Constant.REDIS_PING_INTERVAL;
	this.retryMaxDelay = opts.retryMaxDelay || Constant.REDIS_RETRY_MAX_DELAY;
	this.password = opts.password;
	this.failures = 0;
	this.client = null;
	this.interval = null;
	this.isMaster = false;
	this.available = false;
	this.masterStatus = false;
	this.ready = false;
	this.name = opts.name;
	// this.host + ':' + this.port;
	this.init();
}

Util.inherits(RedisClient, EventEmitter);

var num = 1;

/**
 * redisClient init.
 *
 * @api private
 */
RedisClient.prototype.init = function() {
	var self = this;
	var retryMaxDelay = this.retryMaxDelay;
	var options = {
		retry_max_delay: retryMaxDelay
	};

	if (this.password) {
		options['auth_pass'] = this.password;
	}

	// TEST
	// if (this.port == 6379) {
	// 	if (num++ < 50) {
	// 		this.port -= 100;
	// 	}
	// }
	this.client = redis.createClient(this.port, this.host, options);
	this.client.on('ready', function() {
		self.updateInfo(function() {
			self.watch();
		});
	});

	this.client.on('error', function(err) {
		logger.error('connect to redis %s error: %s', self.name, err.message);
	});

	this.client.on('end', function() {
		if (self.available) {
			self.available = false;
			self.ready = false;
			logger.warn('%s redis client is end, will emit unavailable', self.name);
			self.emit('unavailable', self);
		}
		self.stopWatch();
	});
}

/**
 * redisClient close.
 *
 * @api public
 */
RedisClient.prototype.close = function() {
	this.available = false;
	this.ready = false;
	this.removeAllListeners();
	clearTimeout(this.client.retry_timer);
	this.stopWatch();
	this.client.end();
	this.client.removeAllListeners();
	this.client = null;
};

RedisClient.prototype.slaveOf = function(master, callback) {
	var self = this;
	this.updateInfo(function() {
		var masterName = master.host + ':' + master.port;
		if (self.name === masterName || self.master === masterName) return callback();

		self.client.slaveof(master.host, master.port, function(err) {
			self.updateInfo(function() {
				callback(err);
			});
		});
	});
};

RedisClient.prototype.makeMaster = function(callback) {
	this.slaveOf({
		host: 'NO',
		port: 'ONE'
	}, callback);
};

RedisClient.prototype.updateInfo = function(callback) {
	var self = this;
	this.getInfo(function(info) {
		if (!info) {
			return callback && callback();
		}

		if (self.failures > 0) {
			// TEST ping timeout
			self.failures = 0;
		}

		if (info['role'] === 'master') {
			self.isMaster = true;
			self.master = null;
			self.masterStatus = false;
		} else {
			self.isMaster = false;
			self.master = info['master_host'] + ':' + info['master_port'];
			self.masterStatus = info['master_link_status'] === 'up';
		}

		self.slaves = self.getSlaves(self.client.server_info['redis_version'], info);

		self.syncing = info['master_sync_in_progress'] == '1';
		if (self.syncing) {
			logger.warn('%s is syncing with master %s', self.name, self.master);
			setTimeout(function() {
				if (!self.client) {
					return;
				}

				self.updateInfo();
			}, 10000);

			if (self.available) {
				self.available = false;
				self.ready = false;
				self.emit('unavailable', self);
			}
		} else if (!self.available) {
			self.available = true;
			self.ready = true;
			self.emit('available', self);
		}

		callback && callback();
	});
};

RedisClient.prototype.checkAvailable = function() {
	return this.available;
}

RedisClient.prototype.checkMaster = function() {
	return this.isMaster;
}

RedisClient.prototype.getMaster = function() {
	return this.master;
}

RedisClient.prototype.getMasterStatus = function() {
	return this.masterStatus;
}

RedisClient.prototype.getName = function() {
	return this.name;
}

RedisClient.prototype.toJSON = function() {
	return {
		name: this.name,
		ready: this.ready,
		master: this.master,
		slaves: this.slaves,
		isMaster: this.isMaster,
		available: this.available,
		masterStatus: this.masterStatus
	};
};

RedisClient.prototype.updateHZ = function(hz, cb) {
	this.client.config(['set', 'hz', hz], cb);
}

RedisClient.prototype.fail = function() {
	this.failures += 1;
	if (this.failures >= this.maxFailures) {
		logger.error('%s fail %s times, will be emit unavailable!', this.name, this.failures);
		this.available = false;
		this.ready = false;
		this.stopWatch();
		this.emit('unavailable', this);
		this.failures = 0;
	}
};

RedisClient.prototype.ping = function() {
	var self = this;
	// TEST USE
	// this.fail();
	// logger.warn('%s redis ping timeout %s failures %s', self.name, self.pingTimeout, self.failures);
	// return;
	var timeout = setTimeout(function() {
		logger.warn('%s redis ping timeout %s failures %s', self.name, self.pingTimeout, self.failures);
		self.fail();
	}, self.pingTimeout);

	this.client.ping(function(err) {
		clearTimeout(timeout);
		if (err) {
			self.fail();
			logger.warn('%s redis ping error: %s, failures %s', self.name, err.message, self.failures);
		}
	});
};

RedisClient.prototype.watch = function() {
	var self = this;
	if (this.interval) {
		this.stopWatch();
	}
	this.interval = setInterval(function() {
		self.ping();
	}, self.pingInterval);
};

RedisClient.prototype.stopWatch = function() {
	clearInterval(this.interval);
};

RedisClient.prototype.getInfo = function(callback) {
	var self = this;

	var timeout = setTimeout(function() {
		logger.error('%s redis query timeout %s', self.name, self.queryTimeout);
		return callback(new Error('redis query timeout'));
	}, self.queryTimeout);

	this.client.info('replication', function(err, info) {
		clearTimeout(timeout);
		if (err) {
			logger.error('get %s info error: %s', self.name, err.message);
			return callback();
		}

		var obj = {};
		var lines = info.toString().split("\r\n");
		lines.forEach(function(line) {
			var parts = line.split(':');
			if (parts[1]) {
				obj[parts[0]] = parts[1];
			}
		});

		callback(obj);
	});
};

RedisClient.prototype.getSlaves = function(redisVersion, info) {
	redisVersion = parseFloat(redisVersion);
	var slavesCount = parseInt(info['connected_slaves']) || 0;
	var slaves = [];

	for (var i = 0; i < slavesCount; i++) {
		var ary = info['slave' + i].split(',');
		var obj = {};
		if (redisVersion >= 2.8) {
			ary.map(function(item) {
				var k = item.split('=');
				obj[k[0]] = k[1];
			});
		} else {
			obj.ip = ary[0];
			obj.port = ary[1];
			obj.state = ary[2];
		}
		if (obj.state === 'online') {
			slaves[i] = obj.ip + ':' + obj.port;
		}
	}

	return slaves;
};

module.exports = RedisClient;