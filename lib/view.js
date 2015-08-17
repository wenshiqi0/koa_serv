/**
 * Created by Winsky on 15/7/17.
 */
var fs = require('fs');
var Promise = require('bluebird');
var route = require('koa-route');
var data = require('./data');

module.exports = function(app){
    function next(str) {
        fs.readdirSync(str).forEach(function (name) {
            if(name == 'static')return;
            var array = Array();
            array = name.split('.');
            if (name.indexOf('.') > -1) {
                name = str + '/' +name;
                app.use(route.get(name.substr(14),data(name,array[1])))
            }else{
                next(str+'/'+name);
            }
        })
    }
    next('./public/views');
}
