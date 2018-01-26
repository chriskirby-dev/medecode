define('media/parser/asf', [ 'media/parser/base', 'file/reader', 'binary/util', 'media/util' ], function( parserBase, reader, util, mediaUtil ){
	
	var exports = Object.create( parserBase );
	
	//Matroska, WebM
	
	exports.ignore = [''];
	
	exports.readers = {
		ASF_Extended_Content_Description_Object: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.count = reader.readInt16();
			while( reader.bytesLeft() > 0 ){
				var nl = reader.readInt16();
				var name = util.utfToASCII( reader.readString(nl) ).replace('\u0000','');
				console.log(name);
				var dataType = reader.readInt16();
				var dataLen = reader.readInt16();
				var dTypes = ['STRING', 'BYTE_ARRAY', 'BOOL', 'DWORD', 'QWORD', 'WORD' ];
				var type = dTypes[dataType];
				data[name]  = readType( reader, type, dataLen );
			}
			
			return data;
		},
		ASF_Content_Description_Object: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			var lengths = [reader.readInt16(), reader.readInt16(), reader.readInt16(), reader.readInt16(), reader.readInt16()];
			var keys = ['title','author','copyright','descr','rating'];
			while(keys.length > 0){
				var key = keys.shift();
				var length = lengths.shift();
				if(length > 0){
					data[key] = reader.readString( length );
				}else{
					data[key] = '';
				}
			}
			return data;
		},
		ASF_Stream_Bitrate_Properties_Object: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.count = reader.readInt16();
			data.bitrates = [];
			
			while( reader.bytesLeft() > 0 ){
				var br = {};
				var flags =  util.toArray( reader.readBytes(2) ).map( util.map.toBits );
				var flagVals = flags[0].split('').reverse();
				//console.log('Flags', flagVals );
				br.streamId = parseInt( flagVals.reverse().join(''), 2 );
				br.bitrate = readType( reader, 'DWORD' );
				data.bitrates.push( br );
			}
			
			return data;
		},
		ASF_File_Properties_Object: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.fileUUID = asfUUIDs[readGUID(reader)];
			data.fileSize = readType( reader, 'QWORD' );
			data.creationDate = readType( reader, 'QWORD' );
			data.packetCount = readType( reader, 'QWORD' ); //OK
			data.duration = readType( reader, 'QWORD' ); //OK
			
			data.sendDuration = readType( reader, 'QWORD' );
			data.preroll = readType( reader, 'QWORD' );
			var flags =  util.toArray( reader.readBytes(4) ).map( util.map.toBits );
			var flagVals = flags[0].split('').reverse();
			
			data.flagBroadcast = flagVals[0];
			data.flagSeekable = flagVals[1];
			//reader.readBytes(3)
			data.minPacketSize = readType( reader, 'DWORD' );
			data.maxPacketSize = readType( reader, 'DWORD' );
			data.maxBitrate = readType( reader, 'DWORD' );
			
			return data;
		},
		ASF_Codec_List_Object: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.codecGUID = asfUUIDs[readGUID(reader)];
			data.count = reader.readInt32();
			data.codecs = [];
			while( reader.bytesLeft() > 0 && data.codecs.length < data.count ){
				var type = reader.readInt16();
				var nameL = reader.readInt16();
				 
				var name = nameL > 0 ? reader.readString(nameL*2) : '';
				//console.log('Type', type, 'name L', nameL, name );
				var descrL = reader.readInt16();
				var descr = descrL > 0 ? reader.readString(descrL*2) : '';
				var infoL = reader.readInt16();
				var info = infoL > 0 ? reader.readBytes(infoL) : '';
				var codec = { 
					type: type == 1 ? 'video' : type == 2 ? 'audio' : 'unknown',
					descr: descr,
					name: name,
					info: info
				 };
				data.codecs.push(codec);
				
			}
			return data;
		},
		ASF_Header_Extension_Object: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.reserved = asfUUIDs[readGUID(reader)];
			data.reserved2 = readType( reader, 'WORD' );
			data.dataSize = readType( reader, 'DWORD' );
			data.dataVal = readType( reader, 'STRING', data.dataSize );
			
			return data;
		},
		ASF_Stream_Properties_Object: function( reader ){
			reader.LITTLE_ENDIAN = true;
			var data = {};
			data.streamType = asfUUIDs[readGUID(reader)];
			data.errorCorrectionType = asfUUIDs[readGUID(reader)];
			data.timeOffset = readType( reader, 'QWORD' );
			data.timeSpecDataLength = readType( reader, 'DWORD' );
			data.errorCorrectionDataLength = readType( reader, 'DWORD' );
			
			var flags =  util.toArray( reader.readBytes(2) ).map( util.map.toBits );
			var flagVals = flags[0].split('').slice(0,7).reverse();
			//console.log('FLAGS', flagVals );
			data.streamId = flagVals[0];
			data.encrypted = flags[1].split('').shift();
			
			data.reserved = readType( reader, 'DWORD' );
			//Type Specific
			if( data.streamType == 'ASF_Video_Media' ){
				data.width = readType( reader, 'DWORD' );
				data.height = readType( reader, 'DWORD' );
				data.reserved = reader.readByte();
				var fdSize = readType( reader, 'WORD' );
				var fd2Size = readType( reader, 'DWORD' );
				data.imgWidth = readType( reader, 'LONG' );
				data.imgHeight = readType( reader, 'LONG' );
				data.reserved2 = reader.readByte();
				data.bitsPerPixel = readType( reader, 'WORD' );
				data.compressionID = readType( reader, 'DWORD' );
			}else if( data.streamType == 'ASF_Audio_Media' ){
				data.codecID = readType( reader, 'WORD' );
				data.channels = readType( reader, 'WORD' );
				data.samplesPerSecond = readType( reader, 'DWORD' );
				data.bytesPerSecond = readType( reader, 'DWORD' );
			}
			
			/*
			var flags =  util.toArray( reader.readBytes(4) ).map( util.map.toBits );
			var flagVals = flags[0].split('').reverse();
			data.reliable = flagVals[0];
			data.seekable = flagVals[1];
			data.noCleanPoints = flagVals[2];
			data.noResendCleanPoints = flagVals[3];
			data.streamId = readType( reader, 'WORD' );
			data.streamLanguageId = readType( reader, 'WORD' );
			data.avgTimePerFrame = readType( reader, 'QWORD' );
			data.streamNameCount = readType( reader, 'WORD' );
			data.payloadExtensionSystemCount = readType( reader, 'WORD' );
			
			data.streamNames = [];
			while( data.streamNames.length <= data.streamNameCount){
				var langId = readType( reader, 'WORD' );
				var nameLen = readType( reader, 'WORD' );
				data.streamNames.push( reader.readString( nameLen ) );
			}
			*/
			return data;
		}
	};
	
	var asfUUIDs = { 
		"75B22630-668E-11CF-A6D9-00AA0062CE6C": "ASF_Header_Object",
		"75B22636-668E-11CF-A6D9-00AA0062CE6C": "ASF_Data_Object",
		"33000890-E5B1-11CF-89F4-00A0C90349CB": "ASF_Simple_Index_Object",
		"D6E229D3-35DA-11D1-9034-00A0C90349BE": "ASF_Index_Object",
		"FEB103F8-12AD-4C64-840F-2A1D2F7AD48C": "ASF_Media_Object_Index_Object",
		"3CB73FD0-0C4A-4803-953D-EDF7B6228F0C": "ASF_Timecode_Index_Object",
		//10.2 Header Object GUIDs
		"8CABDCA1-A947-11CF-8EE4-00C00C205365": "ASF_File_Properties_Object",
		"B7DC0791-A9B7-11CF-8EE6-00C00C205365": "ASF_Stream_Properties_Object",
		"5FBF03B5-A92E-11CF-8EE3-00C00C205365": "ASF_Header_Extension_Object",
		"86D15240-311D-11D0-A3A4-00A0C90348F6": "ASF_Codec_List_Object",
		"1EFB1A30-0B62-11D0-A39B-00A0C90348F6": "ASF_Script_Command_Object",
		"F487CD01-A951-11CF-8EE6-00C00C205365": "ASF_Marker_Object",
		"D6E229DC-35DA-11D1-9034-00A0C90349BE": "ASF_Bitrate_Mutual_Exclusion_Object",
		"75B22635-668E-11CF-A6D9-00AA0062CE6C": "ASF_Error_Correction_Object",
		"75B22633-668E-11CF-A6D9-00AA0062CE6C": "ASF_Content_Description_Object",
		"D2D0A440-E307-11D2-97F0-00A0C95EA850": "ASF_Extended_Content_Description_Object",
		"2211B3FA-BD23-11D2-B4B7-00A0C955FC6E": "ASF_Content_Branding_Object",
		"7BF875CE-468D-11D1-8D82-006097C9A2B2": "ASF_Stream_Bitrate_Properties_Object",
		"2211B3FB-BD23-11D2-B4B7-00A0C955FC6E": "ASF_Content_Encryption_Object",
		"298AE614-2622-4C17-B935-DAE07EE9289C": "ASF_Extended_Content_Encryption_Object",
		"2211B3FC-BD23-11D2-B4B7-00A0C955FC6E": "ASF_Digital_Signature_Object",
		"1806D474-CADF-4509-A4BA-9AABCB96AAE8": "ASF_Padding_Object",
		//10.3 Header Extension Object GUIDs
		"14E6A5CB-C672-4332-8399-A96952065B5A": "ASF_Extended_Stream_Properties_Object",
		"A08649CF-4775-4670-8A16-6E35357566CD": "ASF_Advanced_Mutual_Exclusion_Object",
		"D1465A40-5A79-4338-B71B-E36B8FD6C249": "ASF_Group_Mutual_Exclusion_Object",
		"D4FED15B-88D3-454F-81F0-ED5C45999E24": "ASF_Stream_Prioritization_Object",
		"A69609E6-517B-11D2-B6AF-00C04FD908E9": "ASF_Bandwidth_Sharing_Object",
		"7C4346A9-EFE0-4BFC-B229-393EDE415C85": "ASF_Language_List_Object",
		"C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA": "ASF_Metadata_Object",
		"44231C94-9498-49D1-A141-1D134E457054": "ASF_Metadata_Library_Object",
		"D6E229DF-35DA-11D1-9034-00A0C90349BE": "ASF_Index_Parameters_Object",
		"6B203BAD-3F11-48E4-ACA8-D7613DE2CFA7": "ASF_Media_Object_Index_Parameters_Object",
		"F55E496D-9797-4B5D-8C8B-604DFE9BFB24": "ASF_Timecode_Index_Parameters_Object",
		"26F18B5D-4584-47EC-9F5F-0E651F0452C9": "ASF_Compatibility_Object",
		"43058533-6981-49E6-9B74-AD12CB86D58C": "ASF_Advanced_Content_Encryption_Object",
		//10.4 Stream Properties Object Stream Type GUIDs
		"F8699E40-5B4D-11CF-A8FD-00805F5C442B": "ASF_Audio_Media",
		"BC19EFC0-5B4D-11CF-A8FD-00805F5C442B": "ASF_Video_Media",
		"59DACFC0-59E6-11D0-A3AC-00A0C90348F6": "ASF_Command_Media",
		"B61BE100-5B4E-11CF-A8FD-00805F5C442B": "ASF_JFIF_Media",
		"35907DE0-E415-11CF-A917-00805F5C442B": "ASF_Degradable_JPEG_Media",
		"91BD222C-F21C-497A-8B6D-5AA86BFC0185": "ASF_File_Transfer_Media",
		"3AFB65E2-47EF-40F2-AC2C-70A90D71D343": "ASF_Binary_Media",
		//10.4.1 Web stream Type-Specific Data GUIDs
		"776257D4-C627-41CB-8F81-7AC7FF1C40CC": "ASF_Web_Stream_Media_Subtype",
		"DA1E6B13-8359-4050-B398-388E965BF00C": "ASF_Web_Stream_Format",
		//10.5 Stream Properties Object Error Correction Type GUIDs 
		"20FB5700-5B55-11CF-A8FD-00805F5C442B": "ASF_No_Error_Correction",
		"BFC3CD50-618F-11CF-8BB2-00AA00B4E220": "ASF_Audio_Spread",
		//10.6 Header Extension Object GUIDs
		"ABD3D211-A9BA-11cf-8EE6-00C00C205365": "ASF_Reserved_1",
		//10.7 Advanced Content Encryption Object System ID GUIDs
		"7A079BB6-DAA4-4e12-A5CA-91D38DC11A8D": "ASF_Content_Encryption_System_Windows_Media_DRM_Network_Devices",
		//10.8 Codec List Object GUIDs
		"86D15241-311D-11D0-A3A4-00A0C90348F6": "ASF_Reserved_2"
	
	};
	

	
	var readType = function( reader, type, length ){
		var val;
		switch( type ){
			case 'DWORD':
				val = reader.readInt32();
			break;
			case 'QWORD':
				var bitstr = util.toArray( reader.readBytes( 8 ) ).map( util.map.toBits ).reverse().join('');
				val = parseBits( bitstr );
			break;
			case 'WORD':
				val = reader.readInt16();
			break;
			case 'BOOL':
				val = reader.readInt32() == 0 ? false : true;
			break;
			case 'BYTE_ARRAY':
				val = reader.readBytes( length );
			break;
			case 'STRING':
				val = reader.readString( length );
			break;
			case 'LONG':
				val = reader.readInt32();
			break;
		}
		//console.log( 'REAT TYPE', type, val, length )
		return val;
		
	};
			
	var readGUID = function( reader ){
		var hexBytes = util.toArray( reader.readBytes(16) ).map( util.map.toHex );
		var uuid = [];
		uuid[0] = hexBytes.slice(0, 4).reverse().join('');
		uuid[1] = hexBytes.slice(4, 6).reverse().join('');
		uuid[2] = hexBytes.slice(6, 8).reverse().join('');
		uuid[3] = hexBytes.slice(8, 10).join('');
		uuid[4] = hexBytes.slice(10, 16).join('');
		return uuid.join('-');
	};
	
	var parseBits = function( bits ) {
		return parseInt( bits, 2 );
	};
	
	exports.identifyAtomAt = function( start, next ){
		
		var self = this;		
		var end = start+100;
		
		self._source.readAsBuffer( start, end, function( data ){
			//console.log('Identify', start, end );
			var atom = {};
			var reader = self.getReader( data, start );		
			reader.LITTLE_ENDIAN = true;
			atom.startByte = reader.position();
			atom.uuid = readGUID(reader);
			atom.id = asfUUIDs[atom.uuid] ? asfUUIDs[atom.uuid] : atom.uuid;
			atom.type = 'data';
			var sbytes = reader.readBytes( 8 );
			var bitstr = util.toArray( sbytes ).map( util.map.toBits ).reverse().join('');
			atom.size = parseBits( bitstr );
			if( atom.id && atom.id == 'ASF_Header_Object' ){
				atom.type = 'list';
				atom.childCount = reader.readInt32();
				atom.r1 = reader.readInt8();
				atom.r2 = reader.readInt8();
			}else if(atom.key && atom.key == 'ASF_Header_Extension_Object'){
				atom.type = 'list';
			}
			atom.dataStart = reader.position();
			atom.endByte = atom.startByte+atom.size;
			next( atom );
		});
		
	};
	
	
	exports.parseComplete = function( atoms ){
		
		console.log('PARSE COMPLETE', atoms );
		var header = atoms.ASF_Header_Object;
		var videoStreams = [];
		var audioStreams = [];
		for(var hProp in header ){
			if(hProp.indexOf('ASF_Stream_Properties_Object') !== -1){
				if( header[hProp].streamType == 'ASF_Audio_Media' ){
					audioStreams.push( header[hProp] );
				}else if( header[hProp].streamType == 'ASF_Video_Media' ){
					videoStreams.push( header[hProp] );
				}
			}
		}
		
		var metadata = {};
		metadata.preroll = header.ASF_File_Properties_Object.preroll / 1000;
		metadata.seconds = header.ASF_File_Properties_Object.duration / 10000000;
		metadata.title = header.ASF_Content_Description_Object.title;
		metadata.copyright = header.ASF_Content_Description_Object.copyright;
		metadata.description = header.ASF_Content_Description_Object.descr;
		metadata.created = header.ASF_File_Properties_Object.creationDate;
		metadata.filesize = header.ASF_File_Properties_Object.fileSize;
		metadata.duration =  mediaUtil.secondsToTimecode(metadata.seconds);

		metadata.fps = header.ASF_Extended_Content_Description_Object.SfOriginalFPS/10000;
		console.log(JSON.stringify(metadata.fps));
		var codecs = header.ASF_Codec_List_Object.codecs.slice(0);
		var bitrates = header.ASF_Stream_Bitrate_Properties_Object.bitrates.slice(0);
		var c = 0;
		while(codecs.length > 0){
			c++;
			var codec = codecs.shift();
			var bitrate = bitrates.shift();
			if(codec.type == 'audio'){
				metadata.audio = {
					streamId: c,
					codec: codec.name,
					descr: codec.descr,
					bitrate: bitrate.bitrate
				};
				
				
			}else if(codec.type == 'video'){
				metadata.video = {
					streamId: c,
					codec: codec.name,
					descr: codec.descr,
					bitrate: bitrate.bitrate
				};
			}
		}
		
		while(audioStreams.length > 0){
			var audStream = audioStreams.shift();
			//metadata.audio =
		}
		
		while(videoStreams.length > 0){
			var vidStream = videoStreams.shift();
			metadata.video.width = metadata.width = vidStream.width;
			metadata.video.height = metadata.height = vidStream.height;
			//metadata.video =
		}
		
		metadata.video.duration = metadata.duration;
		metadata.video.seconds = metadata.seconds;
		metadata.video.fps = metadata.fps;
		metadata.video.frames = metadata.video.fps * metadata.seconds;
		this.metadata = metadata;
		
	};
	
	exports.findAtoms = function( start, end, callback ){
		
		var self = this;
		
		var continueParse = function(){
			if(self.atoms.length > 30) return false;
			if(start >= self._source.size)
				return self.compileAtoms();
			self.identifyAtomAt( start, function( atom ){
				start = atom.type == 'list' ? atom.dataStart : atom.endByte;
				self.foundAtom(atom);
				if( exports.foundHook ) exports.foundHook(atom, function(){
					continueParse();
				});
				continueParse();
			});
			
		};
		
		continueParse();
	};
	
	return exports;
	
});