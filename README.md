gulp-has
========

> Optimize code paths for has API feature detection.

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-has`

## Usage

```javascript
var has = require( 'gulp-has' ),
    uglify = require( 'gulp-uglify' );

gulp.task( 'compress', function(){
    gulp.src( 'lib/*.js' )
        .pipe( has( {
            // Build for environment that has Object.create
            'object-create': true
        } ) )
        .pipe( uglify( {
            compress: {
                // Discard unreachable code
                dead_code: true
            }
        } ) )
        .pipe( gulp.dest( 'dist' ) );
} );
```

When run against code written like this:

```javascript
if( !has( 'object-create' ) ){
    Object.create = ( function(){
        var Temp = function(){};
        return function( prototype ){
            if( arguments.length > 1 ){
                throw Error( 'Second argument not supported' );
            }
            if( typeof prototype != 'object' ){
                throw TypeError( 'Argument must be an object' );
            }
            
            Temp.prototype = prototype;
            var result = new Temp();
            Temp.prototype = null;
            
            return result;
        };
    } )();
}

var o = Object.create( null );
```

The `compress` task would transform it into something like this:

```javascript
var o = Object.create( null );
```
