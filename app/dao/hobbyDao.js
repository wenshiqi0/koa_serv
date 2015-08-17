/**
 * Created by Winsky on 15/7/22.
 */
var dao = require('bearcat-dao');

var HobbyDao = function(){
    this.$id = "hobbyDao";
    this.$init = "init";
    this.$domainDaoSupport = null;
}

HobbyDao.prototype.add = function(obj, cb) {
    this.$domainDaoSupport.add(obj, cb);
}

HobbyDao.prototype.getByPersonName = function(name,cb){
    this.$domainDaoSupport.getList('$selectTopicWithPerson',name,'hobbyModel',cb);
}

HobbyDao.prototype.getByTopic = function(topic,cb){
    this.$domainDaoSupport.getList('$selectPersonWithTopic',topic,'hobbyModel',cb);
}


module.exports = HobbyDao;