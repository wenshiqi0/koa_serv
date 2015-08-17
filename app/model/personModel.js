var PersonModel = function(){
    this.$mid = "personModel";
    this.$table = "person";
    this.id = "$primary;type:Number";
    this.name = "$type:String";
    this.pass = "$type:String";
}

module.exports = PersonModel;