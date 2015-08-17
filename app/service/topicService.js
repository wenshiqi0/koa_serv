/**
 * Created by Winsky on 15/7/21.
 */
var Promise = require('bluebird');

var TopicService = function() {
    this.$id = "topicService";
    this.$topicDao = null;
}

TopicService.prototype.getByTitle = function*(title){
    var dao = this.$topicDao;
    return yield Promise.fromNode(function(cb){
        dao.getByTitle(title,cb);
    })
}

TopicService.prototype.add = function*(obj) {
    var dao = this.$topicDao;
    return yield Promise.fromNode(function(cb){
        dao.add(obj, cb);
    })
}

module.exports = TopicService;