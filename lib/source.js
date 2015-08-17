/**
 * Created by Winsky on 15/7/17.
 */
var Promise = require('bluebird');
var fs = require('fs');

module .exports = function*(_this,type,file,post){
    switch (type){
        case 'html':
            return yield _this.render(file,{post:post});
        default:
            return yield Promise.fromNode(function(cb){
                fs.readFile(file,cb);
            });
    }
}
