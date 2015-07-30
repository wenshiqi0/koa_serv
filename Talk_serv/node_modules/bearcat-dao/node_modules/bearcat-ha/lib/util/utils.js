var os = require('os');

var Utils = {};

Utils.getHostName = function() {
	return os.hostname();
}

/**
 * Utils check is not null
 *
 * @param  {Object}   value
 * @return {Boolean}  true|false
 * @api public
 */
Utils.isNotNull = function(value) {
	if (value !== null && typeof value !== 'undefined')
		return true;
	return false;
}

module.exports = Utils;