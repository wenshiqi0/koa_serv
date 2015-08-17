/**
 * Created by Winsky on 15/7/22.
 */
var Promise = require('bluebird');

var HobbyService = function() {
    this.$id = "hobbyService";
    this.$hobbyDao = null;
}

HobbyService.prototype.getByPersonName = function*(name){
    var dao = this.$hobbyDao;
    return yield Promise.fromNode(function(cb){
        dao.getByPersonName(name,cb);
    })
}

HobbyService.prototype.getByTopic = function*(topic){
    var dao = this.$hobbyDao;
    return yield Promise.fromNode(function(cb){
        dao.getByTopic(topic,cb);
    })
}

HobbyService.prototype.add = function*(obj){
    var dao = this.$hobbyDao;
    return yield Promise.fromNode(function(cb){
        dao.add(obj,cb);
    })
}

module.exports = HobbyService;