var chat = require('./lib/chat');
var view = require('./lib/view');
var controller = require('./lib/controller');
var config = require('./package.json');
var contextPath = require.resolve('./context.json');
var sqlPath = require.resolve('./app/sql/test.sql');
var app = require('koa')();
var redis = require('redis').createClient;
var timeout = require('koa-timeout')(config.Timeout);
var logger = require('koa-logger');
var render = require('koa-swig');
var sticky = require('sticky-session');
var path = require('path');
var sqlDir = path.dirname(sqlPath);
var bearcat = require('bearcat');
var bearcatDao = require('bearcat-dao')
var tls = require('tls');
var fs = require('fs');
var http = require('http');
var https = require('https');

app.use(function* tryCatch(next){
    try {
        yield next;
    } catch(e) {
        this.status = e.status || config.Timeout;
        this.body = e.message;
    }
})

app.context.render = render({
    root: path.join(__dirname),
    ext: 'html',
});

app.use(timeout);
app.use(logger());

bearcat.createApp([contextPath]);
bearcatDao.loadSQL([sqlDir]);

/*
var options = {
    key:fs.readFileSync(config.tlsOptions.key),
    cert:fs.readFileSync(config.tlsOptions.cert),
}
*/

bearcat.start(function(){
    sticky(function(){
        view(app);
        app.use(require('koa-static')('./public/static'));
        controller(app);
        var server  = http.createServer(app.callback());
        var io = require('socket.io')(server);
        chat(io);
        return server
    }).listen(config.Port);
})






