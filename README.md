gulp-has
========

> Optimize code paths using has API feature detection.

[![npm version](https://img.shields.io/npm/v/gulp-has.svg)](https://www.npmjs.com/package/gulp-has)
[![CI](https://github.com/jeffrose/gulp-has/actions/workflows/ci.yml/badge.svg)](https://github.com/jeffrose/gulp-has/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/gulp-has.svg)](./LICENSE)

`gulp-has` replaces `has( 'feature' )` feature tests in your JavaScript source
with the boolean values from a build-time feature table. A minifier such as
[uglify-js](https://github.com/mishoo/UglifyJS) can then discard the
unreachable code paths, so you ship less code to the environments you target.

## Requirements

- Node.js 22 or newer.

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-has`

## Usage

```javascript
const has = require( 'gulp-has' );
```

`gulp-has` is a dual CommonJS/ESM package, so ES modules can import the
default export instead:

```javascript
import has from 'gulp-has';
```

### Example

```javascript
const { src, dest } = require( 'gulp' );
const has = require( 'gulp-has' );
const uglify = require( 'gulp-uglify' );

function compress(){
    return src( 'lib/*.js' )
        .pipe( has( {
            // Build for an environment that has Object.create
            'object-create': true
        } ) )
        .pipe( uglify( {
            compress: {
                // Discard unreachable code
                dead_code: true
            }
        } ) )
        .pipe( dest( 'dist' ) );
}

exports.compress = compress;
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

## API

### `has( config, [ options ] )`

**config** — `Object`

A map of feature test names to their build-time values. Values are coerced to
booleans: `1`, `true` and `'yes'` become `true`; `0`, `false`, `null` and
`undefined` become `false`.

**options** — `Object`, optional

- **names** — `String[]`, defaults to `[ 'has' ]`. The detector function name
  or names to replace, e.g. `has( 'x' )` or a custom `supports( 'x' )`.
- **replaceUnknown** — `Boolean`, defaults to `false`. When `true`, tests that
  are not present in `config` are replaced with `false` instead of being left
  untouched.

### Replacement rules

A call is replaced when it looks like `has( 'feature' )` — with single, double,
or backtick quotes, and with any whitespace inside the parentheses:

```javascript
has( 'object-create' );
has( "object-create" );
has( `object-create` );
```

Calls that are part of a longer identifier or of a property access are left
alone, so `Map`/`Set` usage and similar code pass through untouched:

```javascript
myhas( 'object-create' );   // left untouched
map.has( 'object-create' ); // left untouched
```

Matching is textual: a `has( 'feature' )` sequence inside a string literal or
comment is replaced as well.

## has API

The `has` API was introduced by [has.js](https://github.com/phiggins42/has.js)
as a convention for doing feature detection; however you don't need to use
`has.js` to take advantage of `gulp-has`.

```javascript
// A small adapter for Modernizr
function has( id ){
    return Modernizr[ id ];
}

if( has( 'canvas' ) ){
    console.log( 'This browser supports canvas.' );
} else {
    console.log( 'No canvas.' );
}
```

## Development

```sh
npm install
npm test          # run the test suite (mocha)
npm run coverage  # run the test suite with coverage (c8)
```

## License

[Apache-2.0](./LICENSE)
