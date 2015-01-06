/**
 * @module has
 * @license Apache-2.0
 */
module.exports = function( config ){

	const
		PLUGIN_NAME	= 'gulp-has',
		HAS_REGEX	=  /has\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

	var
		PluginError	= require( 'gulp-util' ).PluginError,
		Transform	= require( 'stream' ).Transform,
		
		replacer 	= new Transform(),
		plugin		= new Transform( { objectMode: true } ),
		
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
	
	replacer._transform = function( chunk, encoding, done ){
		this.push( replace( chunk, config ) );
		
		done();
	};
	
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

		return done();
	};
	
	return plugin;
};
