var run = function(key, obj) {
	getClient(key, function() {
		console.log(obj);
	})
}

function getClient(key, obj) {

}

var n = 10000 * 10000;
var key = "test_";

var i = 1;
setInterval(function() {
	i++;
	var r = [];
	for (var j = 0; j < 1000; j++) {
		r.push({
			a: key + i
		})
	}
	run(key + i, r);
}, 10);