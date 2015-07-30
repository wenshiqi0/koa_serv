var Tool = require(__dirname + '/sqlParseTool.js');
var Lexter = require(__dirname + '/lexter.js');
var SqlCache = require('./sqlCache');

var parsers = {};

function init() {
  require('fs').readdirSync(__dirname + '/parsers').forEach(function(file) {
    var match = file.match(/^(\w+)\.js$/);
    if (!match) {
      return;
    }
    parsers[match[1].trim().toLowerCase()] = require(__dirname + '/parsers/' + file);
  });
}
init();

exports.parse = function(sql) {
  sql = sql.trim();
  var who = sql.substr(0, sql.indexOf(' ')).toLowerCase();
  if (parsers[who] === undefined) {
    throw new Error("Unsupport sentence");
  }
  return parsers[who].createObj(sql);
}

exports.parseSQL = function(sql) {
  sql = sql.trim();
  var type = sql.substr(0, sql.indexOf(' ')).toLowerCase();
  if (parsers[type] === undefined) {
    throw new Error("Unsupport sentence");
  }

  var sqlCache = this.getSqlCache();
  var result = sqlCache.get(sql);
  if (!result) {
    result = parsers[type].createObj(sql);
    sqlCache.add(sql, result);
  }

  return {
    type: type,
    result: result
  }
}

var sqlCache = null;
exports.getSqlCache = function(max_queue_size) {
  if (!sqlCache) {
    sqlCache = new SqlCache(max_queue_size);
  }

  return sqlCache;
}

exports.RELATE_MAP = Tool.RELATE_MAP;
exports.RELATE = Tool.RELATE;
exports.JOIN = Tool.JOIN;
exports.ORDER = Tool.ORDER;
exports.types = Lexter.types;