'use strict';

var gulp = require( 'gulp' ),
    istanbul = require( 'gulp-istanbul' ),
    mocha = require( 'gulp-mocha' );

gulp.task( 'test', function( done ){
    gulp.src( [ 'index.js' ] )
        .pipe( istanbul() )
        .pipe( istanbul.hookRequire() )
        .on( 'finish', function(){
            gulp.src( [ 'test/*.js' ] )
                .pipe( mocha() )
                .pipe( istanbul.writeReports() )
                .on( 'end', done );
        } );
} );

gulp.task( 'default', [ 'test' ] );