var dao = require('bearcat-dao');

var PersonDao = function(){
    this.$id = "personDao";
    this.$init = "init";
    this.$domainDaoSupport = null;
}

PersonDao.prototype.init = function(){
    this.$domainDaoSupport.initConfig('personModel');
}

PersonDao.prototype.transaction = function(txStatus){
    this.$domainDaoSupport.transaction(txStatus);
    return this;
}

PersonDao.prototype.getAll = function(params,cb){
    var sql = '1=1 ';
    this.$domainDaoSupport.getListByWhere(sql,null,cb);
}

PersonDao.prototype.add = function(obj, cb) {
    this.$domainDaoSupport.add(obj, cb);
}

PersonDao.prototype.getById = function(id, cb) {
    return this.$domainDaoSupport.getById(id, cb);
}

PersonDao.prototype.update = function(title, id, cb) {
    var sql = 'update personModel set title = ? where id = ?';
    this.$domainDaoSupport.update(sql, [title, id], cb);
}

PersonDao.prototype.updateFinished = function(finished, id, cb) {
    var sql = 'update personMode set finished = ? where id = ?';
    this.$domainDaoSupport.update(sql, [finished, id], cb);
}

PersonDao.prototype.deleteById = function(id, cb) {
    this.$domainDaoSupport.deleteById(id, cb);
}

PersonDao.prototype.getByName = function(name,cb){
    this.$domainDaoSupport.getList('$selectUserByName',[name],'personModel',cb);
}

PersonDao.prototype.addTopic = function(name,tid,cb){
    var sql = ''
}


module.exports = PersonDao;