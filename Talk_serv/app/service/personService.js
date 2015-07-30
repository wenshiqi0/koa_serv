var Promise = require('bluebird');

var PersonService = function() {
    this.$id = "personService";
    this.$personDao = null;
}

PersonService.prototype.getList1 = function*() {
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.getById(cb);
    })
}

PersonService.prototype.getList2 = function*() {
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.getById(cb);
    })
}

PersonService.prototype.add = function*(obj) {
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.add(obj, cb);
    })
}

PersonService.prototype.getById = function*(id) {
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.getById(id, cb);
    })
}

PersonService.prototype.getByName = function*(name){
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.getByName(name,cb);
    })
}

PersonService.prototype.update = function*(title, id, cb) {
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.update(title,id, cb);
    })
}

PersonService.prototype.updateFinished = function*(finished, id) {
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.updateFinished(finished,id, cb);
    })
}

PersonService.prototype.deleteById = function*(id) {
    var dao = this.$personDao;
    return yield Promise.fromNode(function(cb){
        dao.deleteById(id, cb);
    })
}

module.exports = PersonService;