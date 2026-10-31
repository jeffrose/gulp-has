'use strict';

const assert = require( 'node:assert/strict' );
const { once } = require( 'node:events' );
const { Readable } = require( 'node:stream' );

const File = require( 'vinyl' );

const has = require( 'gulp-has' );

const TEST_CONTENT = '( function(){ if( has( "console" ) ){\nconsole.log( "test" );\n} }() );';
const TEST_RESULTS = '( function(){ if( true ){\nconsole.log( "test" );\n} }() );';

/**
 * Creates a vinyl file with the given contents.
 * @param {Buffer|Stream|null} contents
 * @returns {File}
 */
function createFile( contents ){
    return new File( {
        cwd: '/',
        base: '/test',
        path: '/test/test.js',
        contents
    } );
}

/**
 * Creates a vinyl file whose contents are a stream of the given chunks.
 * @param {...String} chunks
 * @returns {File}
 */
function createStreamFile( ...chunks ){
    return createFile( Readable.from( chunks ) );
}

/**
 * Resolves with the files produced by the plugin stream.
 * @param {Stream} stream
 * @returns {Promise<File[]>}
 */
function collect( stream ){
    return new Promise( ( resolve, reject ) => {
        const files = [];

        stream.on( 'data', file => files.push( file ) );
        stream.on( 'end', () => resolve( files ) );
        stream.on( 'error', reject );
    } );
}

/**
 * Runs the plugin over the given files and resolves with the output files.
 * @param {Object} config
 * @param {Object} [options]
 * @param {File[]} files
 * @returns {Promise<File[]>}
 */
async function run( config, options, files ){
    const stream = has( config, options );
    const finished = collect( stream );

    files.forEach( file => stream.write( file ) );
    stream.end();

    return finished;
}

/**
 * Reads the contents of a file's contents property as a string.
 * @param {Buffer|Stream|null} contents
 * @returns {Promise<String|null>}
 */
function readContents( contents ){
    if( contents === null ){
        return Promise.resolve( null );
    }

    if( Buffer.isBuffer( contents ) ){
        return Promise.resolve( contents.toString() );
    }

    return new Promise( ( resolve, reject ) => {
        const chunks = [];

        contents.on( 'data', chunk => chunks.push( String( chunk ) ) );
        contents.on( 'end', () => resolve( chunks.join( '' ) ) );
        contents.on( 'error', reject );
    } );
}

/**
 * Runs the plugin over a single buffer-based file and resolves with the
 * transformed contents.
 * @param {String} source
 * @param {Object} config
 * @param {Object} [options]
 * @returns {Promise<String>}
 */
async function transform( source, config, options ){
    const [ file ] = await run( config, options, [ createFile( Buffer.from( source ) ) ] );

    return readContents( file.contents );
}

describe( 'gulp-has', function(){
    describe( 'configuration', function(){
        it( 'throws a plugin error when config is missing', function(){
            assert.throws( () => has(), error => {
                assert.ok( error instanceof Error );
                assert.equal( error.plugin, 'gulp-has' );
                assert.match( error.message, /Missing configuration/ );

                return true;
            } );
        } );

        it( 'throws a plugin error for any falsy config', function(){
            for( const config of [ null, false, undefined, 0, '' ] ){
                assert.throws( () => has( config ), /Missing configuration/ );
            }
        } );

        it( 'works with prototype-less config objects', async function(){
            const config = Object.assign( Object.create( null ), { console: true } );

            assert.equal( await transform( 'has( "console" )', config ), 'true' );
        } );

        it( 'works when config defines a hasOwnProperty key', async function(){
            const config = { hasOwnProperty: true, console: false };

            assert.equal( await transform( 'has( "hasOwnProperty" )', config ), 'true' );
            assert.equal( await transform( 'has( "console" )', config ), 'false' );
        } );
    } );

    describe( 'feature replacement', function(){
        it( 'replaces a known test with its boolean value', async function(){
            assert.equal( await transform( TEST_CONTENT, { console: true } ), TEST_RESULTS );
            assert.equal( await transform( 'has( "console" )', { console: false } ), 'false' );
        } );

        it( 'coerces configured values to booleans', async function(){
            assert.equal( await transform( 'has( "a" )', { a: 1 } ), 'true' );
            assert.equal( await transform( 'has( "a" )', { a: 'yes' } ), 'true' );
            assert.equal( await transform( 'has( "a" )', { a: 0 } ), 'false' );
            assert.equal( await transform( 'has( "a" )', { a: null } ), 'false' );
            assert.equal( await transform( 'has( "a" )', { a: undefined } ), 'false' );
        } );

        it( 'leaves unknown tests untouched by default', async function(){
            assert.equal( await transform( 'has( "promises" )', {} ), 'has( "promises" )' );
        } );

        it( 'replaces unknown tests with false when replaceUnknown is set', async function(){
            const options = { replaceUnknown: true };

            assert.equal( await transform( 'has( "promises" )', {}, options ), 'false' );
            assert.equal( await transform( 'has( "console" )', { console: true }, options ), 'true' );
        } );

        it( 'replaces multiple tests in one file', async function(){
            const source = 'if( has( "a" ) && !has( "b" ) ){ console.log( has( "c" ) ); }';

            assert.equal(
                await transform( source, { a: true, b: false } ),
                'if( true && !false ){ console.log( has( "c" ) ); }'
            );
        } );
    } );

    describe( 'syntax handling', function(){
        it( 'supports single, double, and backtick quotes', async function(){
            const source = 'has( \'a\' ); has( "a" ); has( `a` );';

            assert.equal( await transform( source, { a: true } ), 'true; true; true;' );
        } );

        it( 'supports whitespace inside the call', async function(){
            const source = 'has (  \'a\'  );\nhas\t(\n\t"a"\n);';

            assert.equal( await transform( source, { a: true } ), 'true;\ntrue;' );
        } );

        it( 'ignores mismatched quotes', async function(){
            assert.equal( await transform( 'has( \'a" )', { a: true } ), 'has( \'a" )' );
        } );

        it( 'ignores longer identifiers and property accesses', async function(){
            const source = 'myhas( "a" ); x_has( "a" ); hashtag( "a" ); map.has( "a" ); chain?.has( "a" ); this.#has( "a" );';

            assert.equal( await transform( source, { a: true } ), source );
        } );

        it( 'supports custom detector names', async function(){
            const options = { names: [ 'supports', 'canUse' ] };

            assert.equal( await transform( 'supports( "a" )', { a: true }, options ), 'true' );
            assert.equal( await transform( 'canUse( "a" )', { a: false }, options ), 'false' );
            assert.equal( await transform( 'has( "a" )', { a: true }, options ), 'has( "a" )' );
        } );

        it( 'falls back to "has" for unusable names options', async function(){
            assert.equal( await transform( 'has( "a" )', { a: true }, { names: [] } ), 'true' );
            assert.equal( await transform( 'has( "a" )', { a: true }, { names: 'supports' } ), 'true' );
        } );
    } );

    describe( 'file handling', function(){
        it( 'always produces buffered contents for buffer files', async function(){
            const [ file ] = await run( { console: true }, {}, [ createFile( Buffer.from( TEST_CONTENT ) ) ] );

            assert.ok( Buffer.isBuffer( file.contents ) );
        } );

        it( 'passes the same file object through', async function(){
            const file = createFile( Buffer.from( 'has( "a" )' ) );
            const [ out ] = await run( { a: true }, {}, [ file ] );

            assert.equal( out, file );
            assert.equal( out.path, '/test/test.js' );
        } );

        it( 'passes files with null contents through unchanged', async function(){
            const file = createFile( null );
            const [ out ] = await run( { console: true }, {}, [ file ] );

            assert.equal( out, file );
            assert.equal( out.contents, null );
        } );

        it( 'processes buffers, streams, and null files in one run', async function(){
            const files = [
                createFile( Buffer.from( 'has( "a" );' ) ),
                createStreamFile( 'has( "a" );' ),
                createFile( null )
            ];

            const outputs = await run( { a: true }, {}, files );

            assert.equal( outputs.length, 3 );
            assert.equal( await readContents( outputs[ 0 ].contents ), 'true;' );
            assert.equal( await readContents( outputs[ 1 ].contents ), 'true;' );
            assert.equal( outputs[ 2 ].contents, null );
        } );
    } );

    describe( 'stream files', function(){
        it( 'replaces contents of stream files', async function(){
            const [ file ] = await run( { console: true }, {}, [ createStreamFile( TEST_CONTENT ) ] );

            assert.equal( await readContents( file.contents ), TEST_RESULTS );
        } );

        it( 'replaces calls split across chunk boundaries', async function(){
            const [ file ] = await run( { console: true }, {}, [ createStreamFile( 'has( "con', 'sole" ); has( "a" );' ) ] );

            assert.equal( await readContents( file.contents ), 'true; has( "a" );' );
        } );

        it( 'handles multiple stream files in one run', async function(){
            const files = [
                createStreamFile( 'has( "a" );' ),
                createStreamFile( 'has( "b" );' )
            ];

            const outputs = await run( { a: true, b: false }, {}, files );

            assert.equal( await readContents( outputs[ 0 ].contents ), 'true;' );
            assert.equal( await readContents( outputs[ 1 ].contents ), 'false;' );
        } );

        it( 'forwards source stream errors to the plugin stream', async function(){
            const file = createFile( new Readable( {
                read(){
                    this.destroy( new Error( 'boom' ) );
                }
            } ) );

            const stream = has( { a: true } );

            stream.write( file );
            stream.end();

            // The error is raised by the contents stream asynchronously, so
            // listen for it rather than waiting for the plugin to end.
            const [ error ] = await once( stream, 'error' );

            assert.match( error.message, /boom/ );
        } );
    } );
} );
