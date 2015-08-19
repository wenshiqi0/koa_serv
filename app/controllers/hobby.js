/**
 * Created by Winsky on 15/7/22.
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
            var service = bearcat.getBean('hobbyService');
            var res = yield service.getByPersonName(id.substr(1));
            console.log(res[0].model);
            this.body = res[0].model;
        }catch(e){
            console.error(e);
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
            post = parse(this);
            var service = bearcat.getBean('hobbyService');
            var res = yield service.getByTitle(post.pid);
            if(!res[0]) {
                this.res.statusCode = 204;
                yield service.add({pid:post.pid,tid:post.tid});
                return;
            }else {
                this.res.statusCode = 200;
                return;
            }
            this.res.statusCode = 404;
        }catch(e){
            console.log(e);
        }
    }
}