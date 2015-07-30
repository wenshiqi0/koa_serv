var HaClient = require('./lib/haClient');

var bearcatHa = {};

bearcatHa.createClient = function(opts) {
	return new HaClient(opts);
}

bearcatHa.HASTATE = require('./lib/util/haClientState');

module.exports = bearcatHa;