/**
 * Created by Administrator on 2015/8/17.
 */
var gulp = require('gulp');
var react = require('gulp-react');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');

gulp.task('default',function(){
    "use strict";
    console.log('gulp start');
})

gulp.task('compile',function(){
    "use strict";
    return gulp.src('./react/src/**/*.js')
        .pipe(react())
        .pipe(gulp.dest('./react/build/'));
})

gulp.task('link',function(){
    "use strict";
    return gulp.src('./react/build/main.js')
        .pipe(browserify())
        .pipe(uglify())
        .pipe(gulp.dest('./public/static/js/'));
})

gulp.task('make',['compile','link']);