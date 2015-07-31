#Koa web server
##数据库
使用beacat-dao操作mysql数据库，beacat-dao貌似必须要局部安装
##缓存
缓存使用了redis，这里面还有一个koa的session中间件时使用的redis来保存会话，但是服务器中只是用一个cache.js来封装了一下，没有使用
##页面
目前使用的是swig模版，但是实际上目前也没有使用，因为我主要是关注ios和webapp开发的，我目前在学习react，后续可能会把模版换为jax重写一个页面
##聊天服务
聊天服务时使用的socket.io，这个可以实现了根据不同话题可以创建出不同聊天室，还是比较简易的实现