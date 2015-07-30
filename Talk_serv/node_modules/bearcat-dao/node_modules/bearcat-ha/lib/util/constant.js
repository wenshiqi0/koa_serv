/*!
 * .______    _______     ___      .______       ______     ___   .__________.
 * (   _  )  (   ____)   /   \     (   _  )     (      )   /   \  (          )
 * |  |_)  ) |  |__     /  ^  \    |  |_)  )   |  ,----'  /  ^  \ `---|  |---`
 * |   _  <  |   __)   /  /_\  \   |      )    |  |      /  /_\  \    |  |
 * |  |_)  ) |  |____ /  _____  \  |  |)  ----.|  `----./  _____  \   |  |
 * (______)  (_______/__/     \__\ ( _| `.____) (______)__/     \__\  |__|
 *
 * Bearcat-ha constant
 * Copyright(c) 2015 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

module.exports = {
	REDIS_PING_TIMEOUT: 6 * 1000,
	REDIS_QUERY_TIMEOUT: 1 * 1000,
	REDIS_PING_INTERVAL: 3 * 1000,
	REDIS_MAX_FAILURES: 20,
	REDIS_RETRY_MAX_DELAY: 60 * 1000,

	MYSQL_PING_TIMEOUT: 6 * 1000,
	MYSQL_QUERY_TIMEOUT: 1 * 1000,
	MYSQL_PING_INTERVAL: 3 * 1000,
	MYSQL_MAX_FAILURES: 20,
	MYSQL_RETRY_MAX_DELAY: 60 * 1000,
	MYSQL_RECONNECT_TIMEOUT: 3 * 1000,

	ZK_DEFAULT_CHROOT: "",
	ZK_DEFAULT_CONNECT_TIMEOUT: 15000,
	ZK_DEFAULT_PATH: "/bearcat_ha",

	WATCHER_LOCK_PREFIX: "lock-",
	ADD_NODE_DELAY_TIME: 3 * 1000,
	ADD_NODES_DELAY_TIME: 3 * 1000,
	MASTER_CHECK_NODE_TIME: 3 * 1000,

	WATCHER_TYPE_REDIS: "redis",
	WATCHER_TYPE_MYSQL: "mysql"
}