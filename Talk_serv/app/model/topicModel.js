/**
 * Created by Winsky on 15/7/21.
 */
var TopicModel = function(){
    this.$mid = "topicModel";
    this.$table = "topic";
    this.id = "$primary;type:Number";
    this.title = "$type:String";
    this.img = "$type:String";
}

module.exports = TopicModel;