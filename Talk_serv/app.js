var app = require('koa')();
var config = require('./package.json');
var chat = require('./lib/chat');
var view = require('./lib/view');
var controller = require('./lib/controller');
var timeout = require('koa-timeout')(config.Timeout);
var logger = require('koa-logger');
var render = require('koa-swig');
var path = require('path');
var contextPath = require.resolve('./context.json');
var sqlPath = require.resolve('./app/sql/test.sql');
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

var options = {
    key:fs.readFileSync(config.tlsOptions.key),
    cert:fs.readFileSync(config.tlsOptions.cert),
}

bearcat.start(function(){
    view(app);
    controller(app);

    var server  = http.Server(app.callback());
    var serverS = https.Server(options,app.callback());
    var io = require('socket.io')(server);

    chat(io);

    server.listen(config.Port);
    serverS.listen(config.PortS);
})






