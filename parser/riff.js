define('media/parser/riff', [ 'media/parser/base', 'media/util' ], function( parserBase, mediaUtil ){
	
	/*
	WAV (Windows audio)
	AVI (Windows audiovisual)
	RMI (Windows "RIFF MIDIfile")
	CDR (CorelDRAW vector graphics file)
	ANI (Animated Windows cursors)
	DLS (Downloadable Sounds)
	WebP (An image format developed by Google)
	XMA (Microsoft Xbox 360 console audio format based on WMA Pro)
	 */
	var exports = Object.create( parserBase );
	
	exports.magic = "41 56 49 20 4C 49 53 54";
	exports.ignore = ['movi'];
	exports.head = 0;
	exports.MAX_DATA_IMPORT = 1048576/2;

	var listKeys = ['RIFF', 'LIST'];
	
	exports.readers = {
		avih: function( reader ){
		 	reader.LITTLE_ENDIAN = true;
			var data = {};
			data.microSecPerFrame = reader.readUint32();
			data.frameRateMax = reader.readUint32();
			data.padding = reader.readUint32();
			data.flags = reader.readUint32();
			data.totalFrames = reader.readUint32();
			data.initialFrames = reader.readUint32();
			data.streams = reader.readUint32();
			data.suggestedBufferSize = reader.readUint32();
			data.width = reader.readUint32();
			data.height = reader.readUint32();
			return data;
		},
		strh: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.fccType = reader.readString(4);
			var codecVal = reader.readUint32();
			if(codecVal == 0){
				data.codec = 'Microsoft Device Independent Bitmap';
			}else{
				reader.seek(-4);
				data.codec = reader.readString(4);
				if(data.codec == 'RGB ' || data.codec == 'RAW '){
					data.codec = 'Microsoft Device Independent Bitmap';
				}
			}
			
			
			data.flags = reader.readUint32();
			data.priority = reader.readUint16();
			data.language = reader.readUint16();
			data.initialFrames = reader.readUint32();
			data.scale = reader.readUint32();
			data.rate = reader.readUint32();
			data.start = reader.readUint32();
			data.length = reader.readUint32();
			data.suggestedBuffer = reader.readUint32();
			data.quality = reader.readUint32();
			data.sample_size = reader.readUint32();
			data.rectFrame = reader.readUint32();
			return data;
		},
		strf: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			if( reader.length == 40 ){
				data.biSize = reader.readUint32();
				data.biWidth = reader.readUint32();
				data.biHeight = reader.readUint32();
				data.biPlanes = reader.readUint16();
				data.biBitCount = reader.readUint16();
				data.biCompression = reader.readUint32();
				data.biSizeImage = reader.readUint32();		
			}else if( reader.length == 30 ){
				data.formatTag = reader.readUint16();
				data.channels = reader.readUint16();
				data.samplesPerSecond = reader.readUint32();
				data.bytesPerSecond = reader.readUint32();
				data.blockAlign = reader.readUint32();
				data.bitsPerSecond = reader.readUint32();
				data.cbSize = reader.readUint16();	
			}
			return data;
		},
		readString: function( reader ){
			return { value: reader.readString() };
		},
		INAM: function( reader ){
			return { value: reader.readString() };
		},
		ICOP: function( reader ){
			return { value: reader.readString() };
		},
		ISFT: function( reader ){
			return { value: reader.readString() };
		},
		ISBJ: function( reader ){
			return { value: reader.readString() };
		},
		ICMT: function( reader ){
			return { value: reader.readString() };
		},
		IART: function( reader ){
			return { value: reader.readString() };
		},
		INDEX_CHUNK: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.fcc = reader.readUint32();
			data.lpe = reader.readUint32();
			data.indexSubType = reader.readUint32();
			data.indexType = reader.readUint32();
			data.entrysInUse = reader.readUint32();
			data.chunkId = reader.readUint32();
			data.baseOffset = reader.readInt64();		
			data.reserved = reader.readUint32();
			//Index Entry
			data.entry = [];
			while(reader.bytesLeft() > 0){
				data.entry.push([reader.readUint32(), reader.readUint32()]);
			}
			return data;
		}
	};
	
	exports.identifyAtomAt = function( pos, next ){
		
		var self = this;
		
		self._source.readAsBuffer( pos, pos+30, function( data ){
			
			var atom = {};
			
			var reader = self.getReader( data, pos );
			atom.startByte =  reader.position();
			
			if(reader.readByte() == 0){
				atom.type = 'data';
				atom.id = 'VOID';
				var firstByte = 0;
				while( firstByte === 0 && reader.bytesLeft() > 0 ){
					firstByte = reader.readByte();
					//console.log(firstByte);
				}
				if(firstByte !== 0){
					atom.endByte = reader.position()-1;
					
				}else{
					atom.endByte = reader.position()-1;
				}
				next( atom );
				return false;
			}else{
				reader.seek(-1);
			}
					
			reader.LITTLE_ENDIAN = true;
			atom.key = reader.readString(4);
			atom.type = listKeys.indexOf(atom.key) !== -1 ? 'list' : 'data';
			atom.size = reader.readInt32();
			
			if(atom.type == 'list'){
				atom.size -= 4;
				atom.tag = reader.readString(4);
				atom.id = atom.tag; //DwFourCC
			}else{
				atom.tag = atom.key;
				atom.id = atom.key;
			}
			
			if( self.ignore.indexOf(atom.id) !== -1 ){
				atom.type = 'ignore';
			}
			
			atom.dataStart =  reader.position();
			
			atom.endByte = atom.dataStart + atom.size;
			next( atom );
			
		});
		
	};
/*
	exports.findAtoms = function( start, end, callback ){
		
		var self = this;
		var start = 0;

		var continueParse = function(){
			//console.log('Continue Parse', self.atoms.length);
			if(start >= self._source.size)
				return self.compileAtoms();
			
			self.identifyAtomAt( start, function( atom ){
				start = atom.type == 'list' ? atom.dataStart : atom.endByte;
				self.foundAtom( atom );
				continueParse();
			});
			
		}
		
		continueParse();
	}
	*/
	exports.parseComplete = function( atoms ){
		
		console.log('PARSE COMPLETE', atoms );
		var metadata = {};
		var root = atoms['AVI '];
		var header = root.hdrl.avih;
		
		metadata.binaryLanguage = 'RIFF';
		metadata.title = root.INFO.INAM;
		metadata.width = header.width;
		metadata.height = header.height;
		metadata.writer = root.INFO.ISFT;
		metadata.muxer = '';
		
		metadata.frames = root.hdrl.avih.totalFrames;
		metadata.frameLength = root.hdrl.avih.microSecPerFrame/1000000;
		metadata.seconds = root.hdrl.avih.totalFrames * metadata.frameLength;
		metadata.duration =  mediaUtil.secondsToTimecode(metadata.seconds);
		metadata.fps = metadata.frames/metadata.seconds;
		
		for( var paramName in root.hdrl ){
			if(paramName.indexOf('strl') !== -1){
				var strf = root.hdrl[paramName].strf;
				var strh = root.hdrl[paramName].strh;
				if(strh.fccType == 'vids'){
					if(!metadata.video){
						metadata.video = {};
						metadata.video.height = strf.biHeight;
						metadata.video.width = strf.biWidth;
						metadata.video.bitrate = strh.rate;
						metadata.video.codec = strh.codec;
						metadata.video.frames = metadata.frames;
						metadata.video.seconds = metadata.seconds;
						metadata.video.fps = metadata.fps;
					}
				}else if(strh.fccType == 'auds'){
					if(!metadata.audio){
						metadata.audio = {};
						metadata.audio.channels = strf.channels;
						metadata.audio.frequency = strh.rate+' Hz';
						metadata.audio.codec = strh.codec;
						metadata.audio.language = strh.Language;
					}
				}
			}
			
		}
				
		this.metadata = metadata;
	};
	
	return exports;
	
});