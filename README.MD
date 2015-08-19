#Koa 轻量级Web Service服务器

----------

##约定
* controller需要放在路径./app/controllers中
* html和其他静态资源需要放在路径./web中
* dao放在./app/dao
* model放在./app/model
* service放在./app/service
* sql模版放在./app/sql
* html以及controllers都依照自己所在的文件夹及文件名来映射路由 eg:./web/index.html-->/index.html eg: ./app/controllers/user/login.js-->/user/login

##RESTful
<p>
服务器的webservice是restful的，目前实现了6个方法,list是返回条件查询所获得的列表，fetch是获得用id获得的单个目标，modify是用来修改单个目标，delete是用来删除单个目标，add是添加了一个新的目标
<pre>
<code>
route.get(mapping+'/list',resouce.list)
route.get(mapping+'/:id',resouce.fetch)
route.put(mapping+'/:id',resouce.modify)
route.delete(mapping+'/:id',resouce.delete)
route.get(mapping,resouce.add)
</code>
</pre>
</p>

##数据库：MySQL + Bearcat
<pre>
<code>
var Bearcat = require('bearcat');
var service = Bearcat.getBean('personService')
service.getById('1',cb);
</code>
</pre>
>以上有几点需要注意：

* 每一个表都有dao，model，service组成，dao必须实现了domainDaoSupport的方法来执行sql和普通语句，service是dao的在再一层封装，隐藏了sql语句，model是表的组成
* domainDaoSupport中不是每一个方法都可以使用sqlTemplate，其中getList是可以使用的，在app.js中已经指明了sql语句存放的位置，会在服务器启动时扫描，直接在sql参数中以$字符串的形式输入sql别名
* domainDaoSupport的路径为./node_modules/bearcat-dao/lib/core
* redis和MySQL的配置信息在context.json中
* 强烈建议在service中实现对blubird的Promise的封装，这样可以使业务层逻辑的代码量明显减少，而且逻辑也会更清楚


##服务器缓存：Redis
<pre>
<code>
var redis = require('redis'),
client = redis.createClient();
client.set(key,val,cb)
client.get(kry,cb)
</code>
</pre>
###redis的封装cache.js
<p>
现在在/lib中提供了一个对redis的封装，在这个封装里面会自己创建cache对象，这个对象封装了redis客户端的创建和操作，同样可以在这里加入更多的操作和缓存逻辑，并且如果要更换缓存的实现，包括使用缓存数据库可以在这里修改，而无需去改动业务逻辑的代码。另外在这里还封装了一层对Promise的操作，外部使用可以直接yield一步操作，实现完全的同步代码异步流程
</p>

##异步转同步方案：bluebird + co
__Callback方式__
<pre>
<code>
service.getById(id,function(ret,err){
	//do something to the ret
	//handle the error
	service.add(ret,function(ret,err){
		//handle the error
	}}
})
</code>
</pre>

__ES6使用generator方式__
<pre>
<code>
co(function*(){
	try{
		var res = yield Promise.fromNode(function(cb){
			service.getById(id,cb)
		})
		//do something to the res
		yield service.add(res);
	}catch(e){
		//handle error
	}finally{
		//...
	}
})
</code>
</pre>
>以上有几点需要注意的：

* koa内部的中间件已经都被包含在了co中，实际在中间件中是不需要co的
* 对于需要有返回值的函数需要用bluebird的Promise.fromNode方法将原来的callback方式转化为Promise
* koa中对异步的流程控制都是使用的generator,所以要想加入异步流程就需要这种方式来管理异步方法
* demo中对bearcat和redis都使用了这种处理
* 建议不要将这种Promise转generator的处理过分暴露在逻辑代码里面，会使得代码相当臃肿
* 觉得bluebird太大，而使用功能并不多的情况，可以尝试我重写的fromNode方法，这个方法是使用的native promise，在github下面的另外一个项目中

##Session
<p>
Session是使用了了koa的两个中间件koa-generic-session和koa-redis，这里实际上也可以使用koa-redis来访问redis，koa-generic-session这种Session因为要和redis交互，所以在访问速度上面有损失，而还有另一个koa-session是使用cookie来作为Session的，访问速度上面没有这种损失。你可以通过中间件的上下文来访问这个session，this.session
</p>

##koa-timeout
<p>
koa-timeout是服务器中使用的一个超时中间件，外部访问时间超时后将强制终止此次访问并返回一个500错误，超时时间在package.json中进行配置
</p>

##页面
<p>
实现动态分离了之后，需要将静态文件放在/public/static文件夹下面，可以使用CDN将static分发出去，在/public/views文件夹下面的是动态渲染的html，目前使用的是swig模版渲染，另外加入了react和material-ui，可以使用gulp构建的命令来编译和链接jsx文件，输出一个页面的main.js
</p>

##聊天服务
<p>
聊天服务时使用的socket.io，这个可以实现了根据不同话题可以创建出不同聊天室，还是比较简易的实现，加入sticky-session从而实现了socket.io的会话保持，使得服务器可以由单线程变为了多线程
</P>

##扩展
<p>
nodejs不适合处理大型的业务逻辑和比较复杂的数据计算，这里可以使用apache的thriftjs来扩展nodejs将node上面复杂的业务逻辑放到java上面去，通过RFC服务器的模式来和java进行交互，从而克服在复杂计算上面的不足
</p>