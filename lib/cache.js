/**
 * Created by Winsky on 15/7/17.
 */
var Promise = require('bluebird');
var redis = require('redis');

module.exports = function(){
    return new cache();
}

function cache(){
    var client = redis.createClient();
    this.get = function*(key){
        return yield Promise.fromNode(function(cb){
            client.get(key,cb);
        })
    }

    this.set = function*(key,val){
        return yield Promise.fromNode(function(cb){
            client.set(key,val,cb);
        })
    }

    this.create = function(){
        client = redis.createClient();
    }

    this.close = function(){
        client.end();
    }
}