/**
 * Created by Winsky on 15/7/17.
 */
var bearcat = require('bearcat');
var context = require('./../context.json');
var index = 0;

module .exports = function(io){
    io.on('connection',function(socket){
        index++;
        console.log(index+' coming')

        socket.on('disconnect',function(){
            index--;
            console.log('1 leaving, '+index+' stays');
        })

        socket.emit('start','welcome');

        socket.on('topic',function(data){
            socket.on(data,function(m){
                socket.broadcast.emit(data,m);
                console.log(m);
            })
        })
    })
}