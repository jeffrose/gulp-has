/**
 * @external stream
 * @see {@link http://nodejs.org/api/stream.html}
 */

/**
 * @external gutil
 * @see {@link https://github.com/gulpjs/gulp-util}
 */

/**
 * @class File
 * @memberof external:gutil
 */

/**
 * gulp-has plugin
 * @module has
 * @param {Object} config The has configuration.
 * @returns {Stream} The plugin stream.
 * @throws {PluginError} When the has configuration is not provided.
 * @license Apache-2.0
 */
module.exports = function( config ){
    const
        /** @constant {String} */
        PLUGIN_NAME	= 'gulp-has',
        /** @constant {RegExp} */
        HAS_REGEX	=  /has\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    var
        /**
         * @class PluginError
         * @memberof external:gutil
         */
        PluginError	= require( 'gulp-util' ).PluginError,
        
        /**
         * @class Transform
         * @param {Object} [options]
         * @memberof external:stream
         */
        Transform	= require( 'stream' ).Transform,
        
        /** @type {Transform} */
        replacer 	= new Transform(),
        
        /** @type {Transform} */
        plugin		= new Transform( { objectMode: true } ),
        
        /**
         * Replaces the has statements in contents with the boolean value from config.
         * This is based on r.js code by James Burke
         * @see {@link https://github.com/jrburke/r.js/}
         * @function
         * @param {File} contents
         * @param {Object} config
         * @returns {String} Contents with the has statements replaced with the boolean value from config.
         */
        replace = function( contents, config ){
            return String( contents ).replace( HAS_REGEX, function( match, test ){
                if( config.hasOwnProperty( test ) ){
                    return !!config[ test ];
                }
    
                return match;
            } );
        };
    
    if( !config ){
        throw new PluginError( PLUGIN_NAME, 'Missing configuration' );
    }
    
    /**
     * @function
     * @param {File} chunk
     * @param {String} encoding
     * @param {Function} done
     * @see {@link http://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback}
     */
    replacer._transform = function( chunk, encoding, done ){
        // Pass the transformed chunk along
        this.push( replace( chunk, config ) );
        
        done();
    };
    
    /**
     * @function
     * @param {File} file
     * @param {String} encoding
     * @param {Function} done
     * @see {@link http://nodejs.org/api/stream.html#stream_transform_transform_chunk_encoding_callback}
     */
    plugin._transform = function( file, encoding, done ){
        if( file.isStream() ){
            replacer.on( 'error', this.emit.bind( this, 'error' ) );
            
            file.contents = file.contents.pipe( replacer );
        }

        if( file.isBuffer() ){
            file.contents = new Buffer( replace( file.contents, config ) );
        }

        // Pass the file to the next gulp plugin
        this.push( file );

        done();
    };
    
    return plugin;
};
