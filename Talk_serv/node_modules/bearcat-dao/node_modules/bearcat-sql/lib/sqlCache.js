var MAX_QUEUE_SIZE = 10000;

var SqlCache = function(max_queue_size) {
	this.max_queue_size = max_queue_size || MAX_QUEUE_SIZE;
	this.queue = [];
	this.map = {};
}

SqlCache.prototype.get = function(key) {
	return this.map[key];
}

SqlCache.prototype.add = function(key, value) {
	if (this.map[key]) {
		this.map[key] = value;
		return;
	}

	var current_size = this.queue.length;
	if (current_size + 1 > this.max_queue_size) {
		var head = this.queue.shift();
		delete this.map[head];
	}

	this.queue.push(key);
	this.map[key] = value;
}

module.exports = SqlCache;