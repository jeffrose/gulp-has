'use strict';

var expect      = require( 'chai' ).expect,
    File		= require( 'gulp-util' ).File,
    has 		= require( '../' ),
    Readable    = require( 'stream' ).Readable,
    
    testContent = '( function(){ if( has( "console" ) ){\nconsole.log( "test" );\n} }() );',
    testResults = '( function(){ if( true ){\nconsole.log( "test" );\n} }() );';

function newStream( content ){
    var stream = new Readable();
    
    stream._read = function() {
        this.push( content );
        this.push( null );
    };

    return stream;
}

describe( 'gulp-has', function(){
    var testBuffer, testNull, testStream;
    
    beforeEach( function(){
        testBuffer = new File( {
            cwd         : "/",
            base        : "/test",
            path        : "/test/test.js",
            contents    : new Buffer( testContent )
        } );
        
        testNull = new File( {
            cwd         : "/",
            base        : "/test",
            path        : "/test/test.js",
            contents    : null
        } );
        
        testStream = new File( {
            cwd         : "/",
            base        : "/test",
            path        : "/test/test.js",
            contents    : newStream( testContent )
        } );
    } );
    
    it( 'should process buffer-based files', function(){
        var stream = has( {
            console: true
        } );
        
        stream.on( 'data', function( file ){
            expect( String( file.contents ) ).to.equal( testResults );
        } );
        
        stream.write( testBuffer );
        stream.end();
    } );
    
    it( 'should process null-based files', function(){
        var stream = has( {
            console: true
        } );
        
        stream.on( 'data', function( file ){
            expect( file.contents ).to.equal( null );
        } );
        
        stream.write( testNull );
        stream.end();
    } );
    
    it( 'should process stream-based files', function(){
        var stream = has( {
            console: true
        } );
        
        stream
            .on( 'data', function( file ){
                file.contents.on( 'data', function( contents ){
                    expect( String( contents ) ).to.equal( testResults );
                } );
            } );
        
        stream.write( testStream );
        stream.end();
    } );
    
    it( 'should throw an error when config is not provided', function(){
        expect( has ).to.throw( /Missing configuration/ );
    } );
} );