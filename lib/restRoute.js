/**
 * Created by Winsky on 15/7/17.
 */
var route = require('koa-route');

module .exports = function(mapping,resource){
    //Router Restful
    return [route.get(mapping+'/list',resource.list),

            route.get(mapping+':id',resource.fetch),

            route.post(mapping,resource.add),

            route.put(mapping+':id',resource.modify),

            route.delete(mapping+':id',resource.delete)]
}