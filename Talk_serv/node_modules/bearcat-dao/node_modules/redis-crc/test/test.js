var redisCrc = require('./redisHashSlot');
var crc = require('../index');
// console.log(crc);
var str = 'aaaaaaa';
var a = crc.crc16(str, str.length);
var a1 = crc.keyHashSlot(str, str.length, 4);
var a2 = redisCrc(str, 4);

var str1 = 'aaaaaaaaaaaaaaaaaaa';
var b = crc.crc16(str1, str1.length);
var b1 = crc.keyHashSlot(str1, str1.length, 64);
var b2 = redisCrc(str1, 64);

console.log(a);
console.log(a1);
console.log(a2);

console.log(b);
console.log(b1);
console.log(b2);