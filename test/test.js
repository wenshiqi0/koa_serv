/**
 * Created by Administrator on 2015/8/18.
 */
var request = require('request');
var should = require('should');

var url = 'http://localhost:3001'

describe("http",function(){
    describe("#static text/html",function(){
        it('should return static html docs',function(){
            request(url+'/html/index.html',function(err,res,req){
                if(err)throw err;
                res.should.status(200).html;
                res.body.should.not.empty;
                done();
            })
        })
    })
})

describe('http',function(){
    describe("#static test/javascript",function(){
        it("should return static javascript",function(){
            request(url+'/js/jquery-2.1.4.min.js',function(err,res,req){
                if(err)throw err;
                res.should.status(200).js;
                res.body.should.not.empty;
                done();
            })
        })
    })
})

describe('http',function(){
    describe('#render text/html',function(){
        it("should return a swig rendered html",function(){
            request(url+'/index.html',function(err,res,req){
                if(err)throw err;
                res.should.status(200).html;
                res.body.should.not.empty;
                done();
            })
        })
    })
})

describe('http',function(){
    describe('#Rest method',function(){
        it("should return json by rest method",function(err,res,req){
            request
                .get(url+'/user:wen')
                .on('response',function(res){
                    if(err)throw err;
                    res.should.status(200);
                    res.body.should.not.empty;
                    done();
                })
        })
    })
})

describe('http',function(){
    describe('#404 not found',function(){
        it("should return 404 not found",function(err,res,req){
            request(url+'/notfuond',function(err,res,req){
                if(err)throw err;
                res.should.status(404);
                done();
            })
        })
    })
})

