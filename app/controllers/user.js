/**
 * Created by Winsky on 15/7/17.
 */
var bearcat = require('bearcat');
var Promise = require('bluebird');
var parse = require('co-body');

module.exports = function(){
    return test;
}
var test = {
    list:function*(){
        this.body = 'list';
    },
    fetch:function*(id){
        try{
            var service = bearcat.getBean('personService');
            var res = yield service.getByName(id.substr(1));
            this.type = 'application/json';
            this.body = res[0].model;
        }catch(e){
            throw e;
        }finally{

        }
    },
    modify:function*(id){
        this.body = 'modify'+id;
    },
    delete:function*(id){
        this.body = 'delete'+id;
    },
    add:function*(){
        try{
            var post = yield parse(this);
            var service = bearcat.getBean('personService');
            console.log(service);
            var res = yield service.getByName(post.name);
            if(!res[0]) {
                this.res.statusCode = 204;
                yield service.add({name:post.name,pass:post.pass});
                return;
            }else {
                this.res.statusCode = 200;
                return;
            }
            this.res.statusCode = 404;
        }catch(e){
            throw e;
        }
    }
}