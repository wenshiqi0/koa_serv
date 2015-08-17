/**
 * Created by Winsky on 15/7/22.
 */
var HobbyModel = function(){
    this.$mid = "hobbyModel";
    this.$table = "hobby";
    this.id = "$primary;type:Number";
    this.pid = "$type:String";
    this.tid = "$type:String";
}

module.exports = HobbyModel;