import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import File from 'vinyl';

import has from 'gulp-has';

const require = createRequire( import.meta.url );

/**
 * Runs the plugin over a single buffer-based file and resolves with the
 * transformed contents.
 * @param {String} source
 * @param {Object} config
 * @returns {Promise<String>}
 */
function transform( source, config ){
    const file = new File( {
        cwd: '/',
        base: '/test',
        path: '/test/test.js',
        contents: Buffer.from( source )
    } );

    return new Promise( ( resolve, reject ) => {
        const stream = has( config );

        stream.on( 'data', out => resolve( out.contents.toString() ) );
        stream.on( 'error', reject );

        stream.end( file );
    } );
}

describe( 'gulp-has (ESM entry point)', function(){
    it( 'exports the plugin as the default export', function(){
        assert.equal( typeof has, 'function' );
    } );

    it( 'exports the same function as the CommonJS entry point', function(){
        assert.equal( has, require( 'gulp-has' ) );
    } );

    it( 'transforms files when imported from an ES module', async function(){
        assert.equal(
            await transform( 'if( has( "console" ) ){ console.log( "test" ); }', { console: true } ),
            'if( true ){ console.log( "test" ); }'
        );
    } );
} );
