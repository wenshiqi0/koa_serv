/**
 * Created by Winsky on 15/7/17.
 */
var mime = require("./mime");
var getData = require("./source");
var cache = require('./cache');
var config = require('./../package.json');

module.exports = function(name,stype){
    return function*(post){
        try {
            this.type = mime[stype];
            this.body = yield getData(this,stype,name,post);
        }catch(e){
            console.log(e);
        }finally {

        }
    }
}