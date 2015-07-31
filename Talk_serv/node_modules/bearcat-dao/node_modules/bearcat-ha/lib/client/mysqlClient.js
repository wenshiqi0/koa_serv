var logger = require('pomelo-logger').getLogger('bearcat-ha', 'MysqlClient');
var EventEmitter = require('events').EventEmitter;
var Constant = require('../util/constant');
var mysql = require('mysql');
var Util = require('util');

/**
 * MysqlClient constructor function.
 *
 * @api public
 */
var MysqlClient = function(opts) {
	this.$id = "mysqlClient";
	this.$scope = "prototype";
	this.opts = opts || {};
	this.pool = null;
	this.database = null;
	this.host = opts.host;
	this.port = this.parsePort(opts.port);
	this.user = opts.user;
	this.password = opts.password;
	this.usePool = false; // use single connection
	this.charset = null;
	this.maxFailures = opts.maxFailures || Constant.MYSQL_MAX_FAILURES;
	this.pingTimeout = opts.pingTimeout || Constant.MYSQL_PING_TIMEOUT;
	this.queryTimeout = opts.queryTimeout || Constant.MYSQL_QUERY_TIMEOUT;
	this.pingInterval = opts.pingInterval || Constant.MYSQL_PING_INTERVAL;
	this.retryMaxDelay = opts.retryMaxDelay || Constant.MYSQL_RETRY_MAX_DELAY;
	this.reconnectTimeout = opts.reconnectTimeout || Constant.MYSQL_RECONNECT_TIMEOUT;
	this.reconnectTimer = null;
	this.name = opts.name;
	this.connection = null;
	this.failures = 0;
	this.interval = null;
	this.master = "MASTER"; // mysql master always to be ""
	this.ready = false; // slave ready for promote to master
	this.isMaster = false; // check by mysql read_only status
	this.available = false; // node available for current watcher
	this.masterStatus = true; // link to master status, mysql is always true
	this.init();
}

Util.inherits(MysqlClient, EventEmitter);

MysqlClient.prototype.init = function() {
	var self = this;

	this.getConnection(function(err, connection) {
		if (err) {
			logger.error('mysql getConnection %s error: %s', self.name, err.message);
			return self.onError(true);
		}

		connection.connect(function(err) {
			if (err) {
				logger.error('connect to mysql %s error: %s', self.name, err.message);
				return self.onError(true);
			}

			self.updateInfo(function(err) {
				self.watch();
			});
		});

		connection.on('error', function(err) {
			logger.error('connect to mysql %s error: %s', self.name, err.stack);
			return self.onError();
		});

		self.connection = connection;
	});
}

MysqlClient.prototype.parsePort = function(left) {
	var ports = left.split("/");
	if (ports.length <= 1) {
		return left;
	}

	var port = ports[0];
	return port;
}

MysqlClient.prototype.close = function() {
	this.available = false;
	this.ready = false;
	this.removeAllListeners();
	this.stopWatch();
	if (this.connection) {
		this.connection.end();
		this.connection.removeAllListeners();
		this.connection = null;
	}
};

MysqlClient.prototype.slaveOf = function(master, cb) {
	var self = this;

	var read_only = 1;
	this.setReadOnly(read_only, cb);
}

MysqlClient.prototype.makeMaster = function(cb) {
	var self = this;

	this.updateInfo(function(err) {
		if (err) {
			return cb(err);
		}

		if (!self.ready) {
			return cb();
		}

		var read_only = 0;
		self.setReadOnly(read_only, function(err) {
			if (err) {
				return cb(err);
			}

			self.updateInfo(cb);
		});
	});
}

MysqlClient.prototype.onError = function(force) {
	var self = this;
	if (this.available || force) {
		this.available = false;
		this.ready = false;
		this.stopWatch();
		this.connection.end();
		this.connection.removeAllListeners();
		this.connection = null;
		if (force) {
			if (this.reconnectTimer) {
				return;
			}

			this.reconnectTimer = setTimeout(function() {
				self.emitUnavailable();
			}, this.reconnectTimeout);
		} else {
			self.emitUnavailable();
		}
	}
	// this.init();
}

MysqlClient.prototype.emitUnavailable = function() {
	logger.warn('%s mysql client is end, will emit unavailable', this.name);
	this.emit('unavailable', this);
	clearTimeout(this.reconnectTimer);
	this.reconnectTimer = null;
}

MysqlClient.prototype.updateInfo = function(cb) {
	var self = this;
	self.getInfo(function(err, info) {
		if (err) {
			return cb(err);
		}

		if (!info) {
			return cb();
		}

		if (self.failures > 0) {
			// TEST ping timeout
			self.failures = 0;
		}

		// logger.debug('updateInfo ~~~~~~ %d', self.failures);
		self.ready = self.checkSlaveInfo(info);
		self.isMaster = self.checkIfMaster(info);

		if (!self.available) {
			self.available = true;
			self.emit('available', self);
		}

		cb();
	});
}

MysqlClient.prototype.checkSlaveInfo = function(info) {
	if (!info) {
		return false;
	}

	var Master_Log_File = info['Master_Log_File'];
	var Read_Master_Log_Pos = info['Read_Master_Log_Pos'];
	var Relay_Master_Log_File = info['Relay_Master_Log_File'];
	var Exec_Master_Log_Pos = info['Exec_Master_Log_Pos'];
	var Slave_SQL_Running = info['Slave_SQL_Running'];

	if (Master_Log_File != Relay_Master_Log_File) {
		return false;
	}

	if (Read_Master_Log_Pos != Exec_Master_Log_Pos) {
		return false;
	}

	if (Slave_SQL_Running != 'Yes') {
		return false;
	}

	return true;
}

MysqlClient.prototype.checkIfMaster = function(info) {
	if (!info) {
		return false;
	}

	return info['read_only'] == 'OFF';
}

MysqlClient.prototype.getInfo = function(cb) {
	var self = this;
	this.showSlaveStatus(function(err, info) {
		if (err) {
			return cb(err);
		}

		self.showReadOnly(function(err, rinfo) {
			if (err) {
				return cb(err);
			}

			if (!info) {
				return cb();
			}

			if (rinfo) {
				info['read_only'] = rinfo['Value'];
			}

			cb(null, info);
		});
	});
}

MysqlClient.prototype.showSlaveStatus = function(cb) {
	var sql = 'show slave status';
	this.connection.query(sql, [], function(err, results) {
		if (err) {
			return cb(err);
		}

		if (!results || !results.length) {
			return cb();
		}

		var info = results[0];
		cb(null, info);
	});
}

MysqlClient.prototype.showReadOnly = function(cb) {
	var sql = "show variables like '%read_only%'";
	this.connection.query(sql, [], function(err, results) {
		if (err) {
			return cb(err);
		}

		if (!results || !results.length) {
			return cb();
		}

		var info = results[0];
		cb(null, info);
	});
}

MysqlClient.prototype.setReadOnly = function(read_only, cb) {
	var sql = "set global read_only = ?";
	this.connection.query(sql, [read_only], function(err, results) {
		if (err) {
			return cb(err);
		}

		cb();
	});
}

MysqlClient.prototype.checkAvailable = function() {
	return this.available;
}

MysqlClient.prototype.checkMaster = function() {
	return this.isMaster;
}

MysqlClient.prototype.getMaster = function() {
	return this.master;
}

MysqlClient.prototype.getMasterStatus = function() {
	return this.masterStatus;
}

MysqlClient.prototype.getName = function() {
	return this.name;
}

MysqlClient.prototype.toJSON = function() {
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

MysqlClient.prototype.watch = function() {
	var self = this;
	if (this.interval) {
		this.stopWatch();
	}
	this.interval = setInterval(function() {
		self.ping();
	}, self.pingInterval);
}

MysqlClient.prototype.stopWatch = function() {
	clearInterval(this.interval);
}

MysqlClient.prototype.ping = function() {
	var self = this;
	// TEST USE
	// this.fail();
	// logger.warn('%s mysql ping timeout %s failures %s', self.name, self.pingTimeout, self.failures);
	// return;

	var timeout = setTimeout(function() {
		logger.warn('%s mysql ping timeout %s failures %s', self.name, self.pingTimeout, self.failures);
		self.fail();
	}, self.pingTimeout);

	this.connection.ping(function(err) {
		clearTimeout(timeout);
		if (err) {
			self.fail();
			logger.warn('%s mysql ping error: %s, failures %s', self.name, err.message, self.failures);
		}
	});
}

MysqlClient.prototype.fail = function() {
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

MysqlClient.prototype.query = function(sql, param, cb) {
	var self = this;
	if (!this.available) {
		return cb();
	}

	var timeout = setTimeout(function() {
		logger.error('%s mysql query timeout %s', self.name, self.queryTimeout);
		return cb(new Error('mysql query timeout'));
	}, self.queryTimeout);

	this.getConnection(function(err, connection) {
		if (err) {
			return cb(err);
		}

		var query = connection.query(sql, param, function(err, results) {
			clearTimeout(timeout);
			if (err) {
				logger.error('%s query mysql error %s', self.name, err.stack);
				self.onError();
			}

			cb(err, results);
		});
	});
}

/**
 * MysqlClient get connection.
 *
 * @param  {Function} cb callback function
 * @api public
 */
MysqlClient.prototype.getConnection = function(cb) {
	var self = this;
	if (this.connection) {
		return cb(null, this.connection);
	}

	this.fetchConnector(function(err, connection) {
		if (err) {
			return cb(err);
		}

		self.bindEvents(connection);

		cb(err, connection);
	});
}

MysqlClient.prototype.genId = function(connection, tableName) {

}

/**
 * MysqlClient release connection.
 *
 * @param  {Object} connection
 * @api public
 */
MysqlClient.prototype.release = function(connection) {
	if (this.usePool) {
		connection.release();
	} else {
		connection.end();
	}
}

/**
 * MysqlClient end connection.
 *
 * @param  {Object} connection
 * @api public
 */
MysqlClient.prototype.end = function(connection) {
	connection.end();
}

/**
 * MysqlClient destroy connection.
 *
 * @param  {Object} connection
 * @api public
 */
MysqlClient.prototype.destroy = function(connection) {
	connection.destroy();
}

/**
 * MysqlClient fetch connection.
 *
 * @param  {Function} cb callback function
 * @api public
 */
MysqlClient.prototype.fetchConnector = function(cb) {
	if (this.usePool) {
		if (!this.pool) {
			this.setPool(this.createPool());
		}
		this.pool.getConnection(function(err, connection) {
			cb(err, connection);
		});
	} else {
		var connection = this.createConnection();
		cb(null, connection);
	}
}

MysqlClient.prototype.bindEvents = function(connection) {

}

/**
 * MysqlClient create connection pool.
 *
 * @api public
 */
MysqlClient.prototype.createPool = function() {
	var options = this.getConnectionOptions();

	var pool = mysql.createPool(options);

	return pool;
}

/**
 * MysqlClient create connection.
 *
 * @api public
 */
MysqlClient.prototype.createConnection = function() {
	var options = this.getConnectionOptions();

	var connection = mysql.createConnection(options);

	return this.postProcessConnection(connection);
}

/**
 * MysqlClient get connection options.
 *
 * @return  {Object} connection options
 * @api public
 */
MysqlClient.prototype.getConnectionOptions = function() {
	var options = this.opts;
	var result = {};
	result['host'] = this.host;
	result['port'] = this.port;
	logger.info('getConnectionOptions %s %s', this.host, this.port);
	// if (options.port == 3306) {
	// 	result['port'] = options.port - 10;
	// }
	result['user'] = this.user;
	result['password'] = this.password;
	result['database'] = this.database;
	result['charset'] = this.charset;
	// options['debug'] = true;

	return result
}

/**
 * MysqlClient post process connection.
 *
 * @param  {Object} connection
 * @api public
 */
MysqlClient.prototype.postProcessConnection = function(connection) {
	return connection;
}

/**
 * MysqlClient set port.
 *
 * @param  {Number} port
 * @api public
 */
MysqlClient.prototype.setPort = function(port) {
	this.port = port;
}

/**
 * MysqlClient get port.
 *
 * @return  {Number} port
 * @api public
 */
MysqlClient.prototype.getPort = function() {
	return this.port;
}

/**
 * MysqlClient set host.
 *
 * @param  {String} host
 * @api public
 */
MysqlClient.prototype.setHost = function(host) {
	this.host = host;
}

/**
 * MysqlClient get host.
 *
 * @return  {String} host
 * @api public
 */
MysqlClient.prototype.getHost = function() {
	return this.host;
}

/**
 * MysqlClient set user.
 *
 * @param  {String} user username
 * @api public
 */
MysqlClient.prototype.setUser = function(user) {
	this.user = user;
}

/**
 * MysqlClient get user.
 *
 * @return  {String} username
 * @api public
 */
MysqlClient.prototype.getUser = function() {
	return this.user;
}

/**
 * MysqlClient set password.
 *
 * @param  {String} password
 * @api public
 */
MysqlClient.prototype.setPassword = function(password) {
	this.password = password;
}

/**
 * MysqlClient get password.
 *
 * @return  {String} password
 * @api public
 */
MysqlClient.prototype.getPassword = function() {
	return this.password;
}

/**
 * MysqlClient set database.
 *
 * @param  {String} database
 * @api public
 */
MysqlClient.prototype.setDatabase = function(database) {
	this.database = database;
}

/**
 * MysqlClient get database.
 *
 * @return  {String} database
 * @api public
 */
MysqlClient.prototype.getDatabase = function() {
	return this.database;
}

/**
 * MysqlClient set options.
 *
 * @param  {Object} options
 * @api public
 */
MysqlClient.prototype.setOptions = function(options) {
	this.options = options;
}

/**
 * MysqlClient get options.
 *
 * @return  {Object} options
 * @api public
 */
MysqlClient.prototype.getOptions = function() {
	return this.options;
}

/**
 * MysqlClient set usePool.
 *
 * @param  {Boolean} usePool
 * @api public
 */
MysqlClient.prototype.setUsePool = function(usePool) {
	this.usePool = usePool;
}

/**
 * MysqlClient get usePool.
 *
 * @return  {Boolean} usePool
 * @api public
 */
MysqlClient.prototype.getUsePool = function() {
	return this.usePool;
}

/**
 * MysqlClient set pool.
 *
 * @return  {Object} pool
 * @api public
 */
MysqlClient.prototype.setPool = function(pool) {
	this.pool = pool;
}

/**
 * MysqlClient get pool.
 *
 * @return  {Object} pool
 * @api public
 */
MysqlClient.prototype.getPool = function() {
	return this.pool;
}

module.exports = MysqlClient;