/**
 * Created by Winsky on 15/7/21.
 */
var dao = require('bearcat-dao');

var TopicDao = function(){
    this.$id = "topicDao";
    this.$init = "init";
    this.$domainDaoSupport = null;
}

TopicDao.prototype.transaction = function(txStatus){
    this.$domainDaoSupport.transaction(txStatus);
    return this;
}

TopicDao.prototype.init = function(){
    this.$domainDaoSupport.initConfig('topicModel');
}

TopicDao.prototype.getByTitle = function(title,cb){
    this.$domainDaoSupport.getList('$selectTopicByTitle',[title],'topicModel',cb);
}

TopicDao.prototype.add = function(obj, cb) {
    this.$domainDaoSupport.add(obj, cb);
}

TopicDao.prototype.getAll = function(params,cb){
    var sql = '1=1 ';
    this.$domainDaoSupport.getListByWhere(sql,null,cb);
}

TopicDao.prototype.getById = function(id, cb) {
    this.$domainDaoSupport.getById(id, cb);
}

TopicDao.prototype.update = function(title, id, cb) {
    var sql = 'update personModel set title = ? where id = ?';
    this.$domainDaoSupport.update(sql, [title, id], cb);
}

TopicDao.prototype.updateFinished = function(finished, id, cb) {
    var sql = 'update personMode set finished = ? where id = ?';
    this.$domainDaoSupport.update(sql, [finished, id], cb);
}

module.exports = TopicDao;