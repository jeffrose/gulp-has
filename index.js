'use strict';

/**
 * @external stream
 * @see {@link https://nodejs.org/api/stream.html}
 */

/**
 * @external plugin-error
 * @see {@link https://github.com/gulpjs/plugin-error}
 */

/**
 * @class File
 * @memberof external:vinyl
 * @see {@link https://github.com/gulpjs/vinyl}
 */

/**
 * gulp-has plugin
 *
 * Replaces `has( 'feature' )` feature tests in file contents with the boolean
 * value configured for that feature, so a minifier can discard the unreachable
 * code paths.
 *
 * @module has
 * @param {Object} config Map of feature test names to their build-time values.
 * @param {Object} [options] Plugin options.
 * @param {String[]} [options.names=['has']] Names of the detector function(s)
 *     whose calls are replaced.
 * @param {Boolean} [options.replaceUnknown=false] Replace tests that are
 *     missing from `config` with `false` instead of leaving them untouched.
 * @returns {Stream} The plugin stream.
 * @throws {PluginError} When the has configuration is not provided.
 * @license MIT
 */

const PLUGIN_NAME = 'gulp-has';

const PluginError = require( 'plugin-error' );
const Transform = require( 'stream' ).Transform;

/**
 * Returns the requested detector names, falling back to `[ 'has' ]` when the
 * option is missing or does not contain any usable names.
 * @function
 * @param {*} names
 * @returns {String[]}
 */
function normalizeNames( names ){
    if( !Array.isArray( names ) ){
        return [ 'has' ];
    }

    const valid = names.filter( name => typeof name === 'string' && name.length > 0 );

    return valid.length ? valid : [ 'has' ];
}

/**
 * Builds the regular expression used to find detector calls. Calls that are
 * part of a longer identifier or a property access, such as `myhas( 'x' )` or
 * `map.has( 'x' )`, are ignored. Single, double, and backtick quotes are
 * supported, and mismatched quotes are not matched.
 * @function
 * @param {String[]} names Detector function names.
 * @returns {RegExp}
 */
function createRegex( names ){
    const alternatives = names
        .map( name => name.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) )
        .join( '|' );

    return new RegExp(
        `(?<![\\p{L}\\p{N}_$.#])(?:${alternatives})\\s*\\(\\s*(['"\`])([^'"\`]+)\\1\\s*\\)`,
        'gu'
    );
}

/**
 * Replaces the detector calls in contents with the boolean value from config.
 * This is based on r.js code by James Burke.
 * @see {@link https://github.com/jrburke/r.js/}
 * @function
 * @param {File} contents
 * @param {Object} config
 * @param {RegExp} regex
 * @param {Boolean} replaceUnknown
 * @returns {String} Contents with the detector calls replaced with the boolean
 *     value from config.
 */
function replace( contents, config, regex, replaceUnknown ){
    return String( contents ).replace( regex, function( match, quote, test ){
        if( Object.hasOwn( config, test ) ){
            return String( !!config[ test ] );
        }

        return replaceUnknown ? 'false' : match;
    } );
}

module.exports = function( config, options ){
    if( !config ){
        throw new PluginError( PLUGIN_NAME, 'Missing configuration' );
    }

    options = options || {};

    const regex = createRegex( normalizeNames( options.names ) );
    const replaceUnknown = options.replaceUnknown === true;

    const plugin = new Transform( {
        objectMode: true,

        /**
         * @function
         * @param {File} file
         * @param {String} encoding
         * @param {Function} done
         * @see {@link https://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback}
         */
        transform( file, encoding, done ){
            if( file.isStream() ){
                // A fresh replacer per file: transform streams cannot be
                // reused once they have ended. Chunks are collected so that a
                // call split across chunk boundaries is still replaced.
                const chunks = [];
                const replacer = new Transform( {
                    transform( chunk, chunkEncoding, next ){
                        chunks.push( String( chunk ) );
                        next();
                    },
                    flush( next ){
                        this.push( replace( chunks.join( '' ), config, regex, replaceUnknown ) );
                        next();
                    }
                } );

                // Surface stream errors on the plugin stream instead of
                // letting the pipe drop them silently.
                const forwardError = error => plugin.emit( 'error', error );

                file.contents.on( 'error', forwardError );
                replacer.on( 'error', forwardError );

                file.contents = file.contents.pipe( replacer );
            } else if( file.isBuffer() ){
                file.contents = Buffer.from( replace( file.contents, config, regex, replaceUnknown ) );
            }

            // Pass the file to the next gulp plugin
            this.push( file );

            done();
        }
    } );

    return plugin;
};
