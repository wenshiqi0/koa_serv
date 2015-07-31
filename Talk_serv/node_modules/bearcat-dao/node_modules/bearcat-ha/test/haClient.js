var EventEmitter = require('events').EventEmitter;
var Util = require('util');

var mock = require('./mock');

var HaClient = function() {
	EventEmitter.call(this);
	this.init();
}

Util.inherits(HaClient, EventEmitter);

HaClient.prototype.init = function() {
	var self = this;
	setTimeout(function() {
		self.emit('ready');
	}, 1000)
}

HaClient.prototype.getClient = function(node, role) {
	role = role || 'master';

	return mock[node][role];
}

module.exports = HaClient;