/*!
 * .______    _______     ___      .______       ______     ___   .__________.
 * (   _  )  (   ____)   /   \     (   _  )     (      )   /   \  (          )
 * |  |_)  ) |  |__     /  ^  \    |  |_)  )   |  ,----'  /  ^  \ `---|  |---`
 * |   _  <  |   __)   /  /_\  \   |      )    |  |      /  /_\  \    |  |
 * |  |_)  ) |  |____ /  _____  \  |  |)  ----.|  `----./  _____  \   |  |
 * (______)  (_______/__/     \__\ ( _| `.____) (______)__/     \__\  |__|
 *
 * Bearcat-ha WatcherStrategy
 * Copyright(c) 2015 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

var logger = require('pomelo-logger').getLogger('bearcat-ha', 'WatcherStrategy');
var Utils = require('../util/utils');
var WatcherStrategy = {};

WatcherStrategy.elect = function(data) {
  var votes = {};

  data.forEach(function(item) {
    item.available.forEach(function(i) {
      if (!Utils.isNotNull(votes[i])) {
        votes[i] = 0;
      }

      votes[i] += 1;
    });

    item.unavailable.forEach(function(i) {
      if (!Utils.isNotNull(votes[i])) {
        votes[i] = 0;
      }

      votes[i] -= 1;
    });
  });

  var available = [];
  var unavailable = [];

  for (var name in votes) {
    if (votes[name] > 0) {
      available.push(name);
    } else {
      unavailable.push(name);
    }
  }

  if (unavailable.length) {
    // logger.error('elect votes %j', votes);
  }

  return {
    available: available,
    unavailable: unavailable
  };
};

/**
 *
 * @param node {string}
 * @param snapshots {array}
 * @returns {boolean} return true means the node is available if a majority of watchers say this node is available
 */
WatcherStrategy.electNode = function(node, snapshots) {
  var count = 0;
  snapshots.forEach(function(snapshot) {
    if (snapshot.unavailable.indexOf(node) > -1) {
      count -= 1;
    } else {
      count += 1;
    }
  });

  return count > 0;
};


WatcherStrategy.consensus = function() {

};

module.exports = WatcherStrategy;