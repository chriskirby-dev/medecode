define('media/probe', ['file/reader', 'binary', 'binary/util'], function MediaProbe( reader, binary, util ){
	
	var exports = this.exports;
	var BinaryReader = binary.Reader;
	var chunkSize = 524288;
	
	var MediaProbe = function( file ){
		if(!file.construct) console.log('NOT File API');
		console.log('Media Probe', file.type );
		this.file = file;
		this.pointer = 0;
		this.complete = false;
		this.onSuccess = null;
		this.onProgress = null;
		this.onFail = null;
	};
		
	MediaProbe.prototype.findMagic = function( callback ){
		
		var self = this;
		var typeHeaders = [], typeKeys = [];
		
		require('media/parser/magic').then( function( magic ){
			
			for( var format in magic ){
				var bits =  magic[format].replace(/\s/g, '' );
				typeHeaders.push( util.hex2ASCII( bits ) );
				typeKeys.push( format );
			}
			
			var type_regex = new RegExp(typeHeaders.join("|"));
			self.file.readAsBinaryString( 0, 124, function( data ){
				if( type_regex.test( data ) ){
					// At least one match found
					var matched = data.match(type_regex)[0];
					var typekey = typeKeys[typeHeaders.indexOf( matched )];
					self.mediaFormat = typekey;
					callback( true );
				}else{
					callback( false );
				}
				return false;
			});
			
		});
		
		return false;
	};
	
	MediaProbe.prototype.probeCallback = function(){
		var self = this;
		return {
			success: function( fn ){
				self.onSuccess = fn;
				return self.probeCallback();
			}, 
			fail: function( fn ){
				self.onFail = fn;
				return self.probeCallback();
			},
			progress: function( fn ){
				self.onProgress = fn;
				return self.probeCallback();
			}
		};
	};
	
	MediaProbe.prototype.probe = function( callback ){
		
		var self = this;
		
		self.findMagic(function( canParse ){
			//console.log('PARSED MEDIA AS', self.mediaFormat );
			if( canParse ){
				
				require('media/parser/'+self.mediaFormat ).then( function( FORMAT_PARSER ){
 					
					FORMAT_PARSER.on('metadata', function( metadata ){
						if(self.onSuccess) self.onSuccess( metadata );
					});
					
					FORMAT_PARSER.on('progress', function( progress ){
						if(self.onProgress) self.onProgress( progress );
					});
					
					FORMAT_PARSER.on('fail', function( err ){
						if(self.onFail) self.onFail( err );
					});
					
					FORMAT_PARSER.source( self.file, function( data ){
						console.log( 'SOURCE PARSER LOADED', data );
					});
					
				});
				
			}else{
				callback( null );
			}
			return false;
			
		});
		
		return self.probeCallback();
		
	};
	
	exports.MediaProbe = MediaProbe;
	
	return exports;
	
});