/**
 * Created by Winsky on 15/7/17.
 */

var fs = require('fs');

module.exports = function(app){
    function func(str) {
        fs.readdirSync(str).forEach(function (name) {
            try {
                if (name.indexOf('.js') > -1) {
                    name = name.replace('.js', '');
                    var mapping = '/' + (str + '/' + name).substr(18);
                    var resource = require('./.' + str + '/' + name)();
                    var routes = require('./restRoute')(mapping,resource);

                    for(var rest in routes){
                        app.use(routes[rest]);
                    }

                } else {
                    next(str + '/' + name);
                }
            }catch(e){
                console.error(e);
            }
        })
    }
    func('./app/controllers');
}