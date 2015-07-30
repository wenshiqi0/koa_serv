var logger = require('log4js').getLogger('HZJob');
var Schedule = require('pomelo-schedule');

var jobTypes = [{
		id: 'hzJob1',
		cron: '0 0 1 * * *',
		hz: 200
	}, {
		id: 'hzJob2',
		cron: '0 0 2 * * *',
		hz: 500
	}, {
		id: 'hzJob3',
		cron: '0 0 5 * * *',
		hz: 10
	}
	// , {
	// 	id: 'hzJob5',
	// 	cron: '0 25 17 * * *',
	// 	hz: 30
	// }
	// , {
	// 	id: 'hzJob4',
	// 	cron: '10 * * * * *',
	// 	hz: 30
	// }
];

var HZJob = function() {
	this.jobMaps = {};
	this.watcherManager = null;
}

HZJob.prototype.setWatcherManager = function(watcherManager) {
	this.watcherManager = watcherManager;
}

HZJob.prototype.start = function() {
	var len = jobTypes.length;
	for (var i = 0; i < len; i++) {
		var job = jobTypes[i];
		var id = job['id'];
		var cron = job['cron'];
		var hz = job['hz'];

		var oldJobId = this.jobMaps[id];
		if (oldJobId) {
			Schedule.cancelJob(oldJobId);
		}

		logger.info('start cron job %j', job);
		this.jobMaps[id] = Schedule.scheduleJob(cron, this.updateHZ.bind(this), hz);
	}
}

HZJob.prototype.updateHZ = function(hz) {
	var masterNode = this.watcherManager.masterNode;
	if (masterNode && masterNode.available) {
		masterNode.updateHZ(hz, function(err, r) {
			if (err) {
				logger.error('update hz %j for redis node %j error', hz, masterNode);
				console.log(err);
				return;
			}
			logger.info('update hz %j for redis node %j %j', hz, masterNode, r);
		});
	}
}

module.exports = HZJob;