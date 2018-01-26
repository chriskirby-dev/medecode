define('media/parser/ebml', [ 'media/parser/base', 'file/reader', 'binary/util', 'media/util' ], function( parserBase, reader, util, mediaUtil ){
	
	var exports = Object.create( parserBase );
	
	//Matroska, WebM
	
	//exports.ignore = [''];
	//
	exports.ignore = ['Cluster'];
	exports.readers = {
		
	};
	
	var codes = {
		header: "1A 45 DF A3"
	};
	
	var readDate = function( reader ){
		var startDate = new Date(2001, 0, 1, 24, 0);
		var startTime = startDate.getTime();
		var timeSince =  reader.readUint32();
		var field_date = new Date( startTime + (timeSince*1000) );
		return field_date.toUTCString();
	};
	
	
	var codeKeys = {
		'XX': 'XX',
		"42 82": 'docType:String',
		'42 87': 'doctypeVersion:Uint',
		'42 85': 'doctypeReadVersion:Uint',
		'42 86': 'EMBLVersion',
		'42 F7': 'EMBLReadVersion',
		'42 F2': 'EMBLMaxIDLength',
		'42 F3': 'EMBLMaxStringLength',
		'1A 45 DF A3': 'Header',
		'18 53 80 67': 'Segment',
		'15 49 A9 66': 'SegmentInfo',
		'11 4D 9B 74': 'SeekHead',
		'16 54 AE 6B': 'Tracks',
		'2A D7 B1': 'TimeCodeScale',
		'44 89': 'Duration:Uint',
		'7B A9': 'Title',
		'EC': 'VOID',
		'BF': 'CRC-32',
		'4D BB': 'Seek',
		'11 4D 9B 74': 'SeekHead',
		'53 AB': 'SeekID',
		'53 AC': 'SeekPosition',
		'73 A4': 'SegmentUID:String',
		'73 84': 'SegmentFilename',
		'2A D7 B1': 'TimecodeScale:Uint',
		'44 89': 'Duration:Float',
		'44 61': 'DateUTC:String',
		'7B A9': 'Title:String',
		'4D 80': 'MuxingApp:String',
		'57 41': 'WritingApp:String',
		'1F 43 B6 75': 'Cluster',
		'E7': 'Timecode:Uint',
		'86': 'CodecID:String',
		'25 86 88': 'CodecName:String',
		'B0': 'PixelWidth:Uint',
		'BA': 'PixelHeight:Uint',
		'54 B3': 'AspectRatioType',
		'53 B8': 'StereoMode',
		'D7': 'TrackNumber:Uint',
		'AE': 'TrackEntry',
		'73 C5': 'TrackUID:String',
		'83': 'TrackType:Uint',
		'B9': 'FlagEnabled:Uint',
		'88': 'FlagDefault:Uint',
		'55 AA': 'FlagForced:Uint',
		'9C': 'FlagLacing:Uint',
		'6D E7': 'MinCache:Uint',
		'6D F8': 'MaxCache:Uint',
		'23 E3 83': 'DefaultDuration:Uint',
		'55 EE': 'MaxBlockAdditionID',
		'AA': 'CodecDecodeAll:Uint',
		'E1': 'Audio',
		'63 A2': 'CodecPrivate',
		'25 86 88': 'CodecName:String',
		'74 46': 'AttachmentLink',
		'22 B5 9C': 'Language:String',
		'53 6E': 'Name:String',
		'E0': 'Video',
		'23 31 4F': 'TrackTimecodeScale:Float',
		'A5': 'TrackTimecodeScale:Uint',
		'85': 'ChapString',
		'B7': 'CueTrackPositions',
		'BB': 'CuePoint',
		'10 43 A7 70': 'Chapter',
		'1C 53 BB 6B': 'Cues',
		'F7': 'CueTrack',
		'F1': 'CueClusterPosition',
		'B3': 'CueTime:Uint',
		'B2':'CueDuration:Float',
		'54 B0': 'DisplayWidth:Uint',
		'54 BA': 'DisplayHeight:Uint',
		'9A': 'FlagInterlaced:Uint',
		'B5': 'SamplingFrequency:Float',
		'9F': 'Channels:Uint',
		'78 B5': 'OutputSamplingFrequency:Float',
		'62 64': 'BitDepth',
		'23 83 E3': 'FrameRate',
		'54 BA': 'DisplayUnit',
		'54 B3': 'AspectRatioType',
		'78 B5': 'OutputSamplingFrequency',
		'9A': 'FlagInterlaced:Uint',
		'CD': 'FrameNumber',
		'23 83 E3': 'FrameRate'
	};
	
	var mastrokiaCodecs = {
		'V_VP8': {  code: "V_MS/VFW/FOURCC", name: "WEBM (Google)" },
'V_MS/VFW/FOURCC': {  code: "V_MS/VFW/FOURCC", name: "Microsoft (TM) Video Codec Manager (VCM)", descr: "V_MS/VFW/FOURCC - Microsoft (TM) Video Codec Manager (VCM)" },
'V_UNCOMPRESSED': {  code: "V_UNCOMPRESSED", name: "Video, raw uncompressed video frames", descr: "The private data is void, all details about the used colour specs and bit depth are to be put/read from the KaxCodecColourSpace elements." },
'V_MPEG4/ISO/???': {  code: "V_MPEG4/ISO/???", name: "MPEG4 ISO Profile Video", descr: "The stream complies with, and uses the CodecID for, one of the MPEG-4 profiles listed below." },
'V_MPEG4/ISO/SP': {  code: "V_MPEG4/ISO/SP", name: "MPEG4 ISO simple profile (DivX4)", descr: "stream was created via improved codec API (UCI) or even transmuxed from AVI (no b-frames in Simple Profile), frame order is coding order" },
'V_MPEG4/ISO/AVC': {  code: "V_MPEG4/ISO/AVC", name: "MPEG4 ISO H.264 Format", descr: "" },
'V_MPEG4/ISO/ASP': {  code: "V_MPEG4/ISO/ASP", name: "MPEG4 ISO advanced simple profile (DivX5, XviD, FFMPEG)", descr: "stream was created via improved codec API (UCI) or transmuxed from MP4, not simply transmuxed from AVI! Note there are differences how b-frames are handled in these native streams, when being compared to a VfW created stream, as here there are no dummy frames inserted, the frame order is exactly the same as the coding order, same as in MP4 streams!" },
'V_MPEG4/ISO/AP': {  code: "V_MPEG4/ISO/AP", name: "MPEG4 ISO advanced profile", descr: "stream was created ... (see above)" },
'V_MPEG4/MS/V3': {  code: "V_MPEG4/MS/V3", name: "Microsoft (TM) MPEG4 V3", descr: "and derivates, means DivX3, Angelpotion, SMR, etc.; stream was created using VfW codec or transmuxed from AVI; note that V1/V2 are covered in VfW compatibility mode" },
'V_MPEG1': {  code: "V_MPEG1", name: "MPEG 1", descr: "The matroska video stream will contain a demuxed Elementary Stream (ES ), where block boundaries are still to be defined. Its recommended to use MPEG2MKV.exe for creating those files, and to compare the results with selfmade implementations" },
'V_MPEG2': {  code: "V_MPEG2", name: "MPEG 2", descr: "The matroska video stream will contain a demuxed Elementary Stream (ES ), where block boundaries are still to be defined. Its recommended to use MPEG2MKV.exe for creating those files, and to compare the results with selfmade implementations" },
'V_REAL/????': {  code: "V_REAL/????", name: "Real Video(TM)", descr: "The stream is one of the Real Video(TM) video streams listed below. Source for the codec names are from Karl Lillevold on Doom9. The CodecPrivate element contains a real_video_props_t structure in Big Endian byte order as found in librmff." },
'V_REAL/RV10': {	 code: "V_REAL/????", name: 'RealVideo 1.0 aka RealVideo 5' },
'V_REAL/RV20': {  code: "V_REAL/RV20", name: "RealVideo G2 and RealVideo G2+SVT", descr: "Individual slices from the Real container are combined into a single frame." },
'V_REAL/RV30': {  code: "V_REAL/RV30", name: "RealVideo 8", descr: "Individual slices from the Real container are combined into a single frame." },
'V_REAL/RV40': {  code: "V_REAL/RV40", name: "rv40 : RealVideo 9", descr: "Individual slices from the Real container are combined into a single frame." },
'V_QUICKTIME': {  code: "V_QUICKTIME", name: "Video taken from QuickTime(TM) files", descr: "Several codecs as stored in QuickTime, e.g. Sorenson or Cinepak. The CodecPrivate contains all additional data that is stored in the 'stsd' (sample description) atom in the QuickTime file after the mandatory video descriptor structure (starting with the size and FourCC fields). For an explanation of the QuickTime file format read Apple's PDF on QuickTime." },
'V_THEORA': {  code: "V_THEORA", name: "Theora", descr: "The private data contains the first three Theora packets in order. The lengths of the packets precedes them. The actual layout is:" },
'V_PRORES': {  code: "V_PRORES", name: "Apple ProRes", descr: "The private data contains the fourcc as found in MP4 movies:" },

'A_MPEG/L3': {  code: "A_MPEG/L3", name: "MPEG Audio 1, 2, 2.5 Layer III", descr: "" },
'A_MPEG/L2': {  code: "A_MPEG/L2", name: "MPEG Audio 1, 2 Layer II", descr: "" },
'A_MPEG/L1': {  code: "A_MPEG/L1", name: "MPEG Audio 1, 2 Layer I", descr: "" },
'A_PCM/INT/BIG': {  code: "A_PCM/INT/BIG", name: "PCM Integer Big Endian", descr: "" },
'A_PCM/INT/LIT': {  code: "A_PCM/INT/LIT", name: "PCM Integer Little Endian", descr: "" },
'A_PCM/FLOAT/IEEE': {  code: "A_PCM/FLOAT/IEEE", name: "Floating Point, IEEE compatible", descr: "" },
'A_MPC': {  code: "A_MPC", name: "MPC (musepack) SV8", descr: "The main developer for musepack has requested that we wait until the SV8 framing has been fully defined for musepack before defining how to store it in Matroska." },
'A_AC3':  {	code: "A_AC3", name: "(Dolby™) AC3" },
'A_AC3/BSID9': { code: "A_AC3/BSID9", name: "(Dolby™) AC3" },
'A_AC3/BSID10':{	code: "A_AC3/BSID1", name: "(Dolby™) AC3" },
'A_ALAC': {  code: "A_ALAC", name: "ALAC (Apple Lossless Audio Codec)", descr: "The private data contains ALAC's magic cookie (both the codec specific configuration as well as the optional channel layout information). Its format is described in ALAC's official source code." },
'A_DTS': {  code: "A_DTS", name: "Digital Theatre System", descr: "Supports DTS, DTS-ES, DTS-96/26, DTS-HD High Resolution Audio and DTS-HD Master Audio. The private data is void. Corresponding ACM wFormatTag : 0x2001" },
'A_DTS/EXPRESS': {  code: "A_DTS/EXPRESS", name: "Digital Theatre System Express", descr: "DTS Express (a.k.a. LBR) audio streams. The private data is void. Corresponding ACM wFormatTag : 0x2001" },
'A_DTS/LOSSLESS': {  code: "A_DTS/LOSSLESS", name: "Digital Theatre System Lossless", descr: "DTS Lossless audio that does not have a core substream. The private data is void. Corresponding ACM wFormatTag : 0x2001" },
'A_VORBIS': {  code: "A_VORBIS", name: "Vorbis", descr: "The private data contains the first three Vorbis packet in order. The lengths of the packets precedes them. The actual layout is:" },
'A_FLAC': {  code: "A_FLAC", name: "FLAC (Free Lossless Audio Codec)", descr: "The private data contains all the header/metadata packets before the first data packet. These include the first header packet containing only the word fLaC as well as all metadata packets." },
'A_REAL/????': {  code: "A_REAL/????", name: "Realmedia Audio codecs", descr: "The stream contains one of the following audio codecs. In each case the CodecPrivate element contains either the real_audio_v4_props_t or the real_audio_v5_props_t structure (differentiated by their version field; Big Endian byte order) as found in librmff." },
'A_REAL/14_4': {  code: "A_REAL/14_4", name: "Real Audio 1", descr: " " },
'A_REAL/28_8': {  code: "A_REAL/28_8", name: "Real Audio 2", descr: " " },
'A_REAL/COOK': {  code: "A_REAL/COOK", name: "Real Audio Cook Codec (codename: Gecko)", descr: " " },
'A_REAL/SIPR': {  code: "A_REAL/SIPR", name: "Sipro Voice Codec", descr: " " },
'A_REAL/RALF': {  code: "A_REAL/RALF", name: "Real Audio Lossless Format", descr: " " },
'A_REAL/ATRC': {  code: "A_REAL/ATRC", name: "Sony Atrac3 Codec", descr: " " },
'A_MS/ACM': {  code: "A_MS/ACM", name: "Microsoft(TM) Audio Codec Manager (ACM)", descr: "The private data contains the ACM structure WAVEFORMATEX including the extra private bytes, as defined by Microsoft. The data are stored in little endian format (like on IA32 machines)." },
'A_AAC': {  code: "A_AAC", name: "AAC Profile Audio", descr: "The stream complies with, and uses the CodecID for, one of the AAC profiles listed below. AAC audio always uses wFormatTag 0xFF" },
'A_AAC/MPEG2/MAIN': {  code: "A_AAC/MPEG2/MAIN", name: "MPEG2 Main Profile", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG2/LC': {  code: "A_AAC/MPEG2/LC", name: "Low Complexity", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG2/LC/SBR': {  code: "A_AAC/MPEG2/LC/SBR", name: "Low Complexity with Spectral Band Replication", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG2/SSR': {  code: "A_AAC/MPEG2/SSR", name: "Scalable Sampling Rate", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG4/MAIN': {  code: "A_AAC/MPEG4/MAIN", name: "MPEG4 Main Profile", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG4/LC': {  code: "A_AAC/MPEG4/LC", name: "Low Complexity", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG4/LC/SBR': {  code: "A_AAC/MPEG4/LC/SBR", name: "Low Complexity with Spectral Band Replication", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG4/SSR': {  code: "A_AAC/MPEG4/SSR", name: "Scalable Sampling Rate", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_AAC/MPEG4/LTP': {  code: "A_AAC/MPEG4/LTP", name: "Long Term Prediction", descr: "The private data is void. Channel number and sample rate have to be read from the corresponding audio element. Audio stream is stripped from ADTS headers and normal matroska frame based muxing scheme is applied." },
'A_QUICKTIME': {  code: "A_QUICKTIME", name: "Audio taken from QuickTime(TM) files", descr: "Several codecs as stored in QuickTime, e.g. QDesign Music v1 or v2. The CodecPrivate contains all additional data that is stored in the 'stsd' (sample description) atom in the QuickTime file after the mandatory sound descriptor structure (starting with the size and FourCC fields). For an explanation of the QuickTime file format read Apple's PDF on QuickTime." },
'A_QUICKTIME/????': {  code: "A_QUICKTIME/????", name: "QuickTime audio codecs", descr: "This CodecID is deprecated in favor of A_QUICKTIME (without a trailing codec name). Otherwise the storage is identical; see A_QUICKTIME for details." },
'A_QUICKTIME/QDMC': {  code: "A_QUICKTIME/QDMC", name: "QDesign Music",  },
'A_QUICKTIME/QDM2': {code: "A_QUICKTIME/QDM2", name: "QDesign Music v2", },
'A_TTA1': {  code: "A_TTA1", name: "The True Audio lossles audio compressor", descr: "TTA format description" },
'A_WAVPACK4': {  code: "A_WAVPACK4", name: "WavPack lossles audio compressor", descr: "The Wavpack packets consist of a stripped header followed by the frame data. For multi-track (> 2 tracks) a frame consists of many packets. For hybrid files (lossy part + correction part), the correction part is stored in an additional block (level 1). For more details, check the WavPack muxing description." },
'S_TEXT': {  code: "S_TEXT", name: "UTF-8 Plain Text" },
'S_TEXT/UTF8': {  code: "S_TEXT/UTF8", name: "UTF-8 Plain Text", descr: "Basic text subtitles. For more information, please look at the Subtitle specifications." },
'S_TEXT/SSA': {  code: "S_TEXT/SSA", name: "Subtitles Format", descr: "The [Script Info] and [V4 Styles] sections are stored in the codecprivate. Each event is stored in its own Block. For more information, please read the specs for SSA/ASS." },
'S_TEXT/ASS': {  code: "S_TEXT/ASS", name: "Advanced Subtitles Format", descr: "The [Script Info] and [V4 Styles] sections are stored in the codecprivate. Each event is stored in its own Block. For more information, please read the specs for SSA/ASS." },
'S_TEXT/USF': {  code: "S_TEXT/USF", name: "Universal Subtitle Format", descr: "This is mostly defined, but not typed out yet. It will first be available on the USF specs page." },
'S_IMAGE/BMP': {  code: "S_IMAGE/BMP", name: "Bitmap", descr: "Basic image based subtitle format; The subtitles are stored as images, like in the DVD. The timestamp in the block header of matroska indicates the start display time, the duration is set with the Duration element. The full data for the subtitle bitmap is stored in the Block's data section." },
'S_VOBSUB': {  code: "S_VOBSUB", name: "VobSub subtitles", descr: "The same subtitle format used on DVDs. Supoprted is only format version 7 and newer. VobSubs consist of two files, the .idx containing information, and the .sub, containing the actual data. The .idx file is stripped of all empty lines, of all comments and of lines beginning with alt: or langidx:. The line beginning with id: should be transformed into the appropriate Matroska track language element and is discarded. All remaining lines but the ones containing timestamps and file positions are put into the CodecPrivate element." },
'S_KATE': {  code: "S_KATE", name: "Karaoke And Text Encapsulation", descr: "A subtitle format developped for ogg. The mapping for Matroska is described on the Xiph wiki. As for Theora and Vorbis, Kate headers are stored in the private data as xiph-laced packets." }
};
	
	var listKeys = [ '1C 53 BB 6B', 'E1', 'E0', '1A 45 DF A3', 'B7', 'BB', '4D BB', '18 53 80 67', '15 49 A9 66', '44 44', '69 24', '69 FC', '58 D7', 'A3', 'A0', 'A6', 'FB', 'E8', '16 54 AE 6B', 'AE' ];
	
	var variableTypes = {
		nanoseconds: [],
		string: ['Title', 'MuxingApp', 'WritingApp' ]
	};

	var readVSizeByte = function( reader ){
		
		var sizeMarkerByte = reader.readInt8();
		var sizemarker = readBitMarker( sizeMarkerByte );
		var strail = 0;
		var bitstr = "";
		//console.log('sizemarker', sizemarker);
		if(sizemarker < 7){
			strail = 7 - sizemarker;
			//console.log('SIZE TRAIL MARKER',  strail );
			bitstr = util.byteToBits( sizeMarkerByte ).slice( sizemarker + 1 ).join('');
			//console.log('SIZE TRAIL BIN',  bitstr );
		}
		
		//console.log('SIZE MARKER',  sizemarker );
		if( sizemarker > 0 ){
			var sbytes = reader.readBytes(sizemarker);
			//console.log('SIZE BYTES',  sbytes );
			var sbits = util.toArray( sbytes ).map( util.map.toBits );
			bitstr += sbits.join(' ').split(' ').join('');
		}
		return Number( parseInt( bitstr, 2 ) );
	};
	
	var readKeyLength = function( reader ){
		var sizeBits = util.byteToBits( reader.readByte() );
		reader.seek(-1);
		return sizeBits.indexOf(1) + 1;
	};
	
	var readBitMarker = function( byte ){
		var sizeBits = util.byteToBits( byte  );
		//console.log('sizeBits', sizeBits);
		return sizeBits.indexOf(1);
	};
	
	var readUint = function( reader, length ){
		var sbytes = reader.readBytes( length );
		//console.log('SIZE BYTES',  sbytes );
		var sbits = util.toArray( sbytes ).map( util.map.toBits );
		var bitstr = sbits.join(' ').split(' ').join('');
		
		return Number( parseInt( bitstr, 2 ) );
	};
	
	var readFloat = function( reader, length ){
		var sbytes = reader.readBytes( length );
		//console.log('SIZE BYTES',  sbytes );
		var sbits = util.toArray( sbytes ).map( util.map.toBits );
		var bitstr = sbits.join(' ').split(' ').join('');
		var bits = bitstr.split('');
		var bytes = sbits.length*8;
		if( (bytes) < 32 ){
			var fill = 32 - bytes;
			console.log('Fill', fill);
			while(fill > 0){ bits.unshift("0"); fill--; }
		}
		//console.log(bits.length, bits.join(''));
		var binary = bits.join('');
		var sign = (binary.charAt(0) == '1')?-1:1;
	    var exponent = parseInt(binary.substr(1, 8), 2) - 127;
	    var significandBase = binary.substr(9);
	    var significandBin = '1'+significandBase;
	    var i = 0;
	    var val = 1;
	    var significand = 0;
	
	    if (exponent == -127) {
	        if (significandBase.indexOf('1') == -1)
	            return 0;
	        else {
	            exponent = -126;
	            significandBin = '0'+significandBase;
	        }
	    }
	
	    while (i < significandBin.length) {
	        significand += val * parseInt(significandBin.charAt(i));
	        val = val / 2;
	        i++;
	    }
	
	    return sign * significand * Math.pow(2, exponent);
	};
	
	exports.identifyAtomAt = function( start, next ){
		
		var self = this;		
		var end = start+100;
		
		
		self._source.readAsBuffer( start, end, function( data ){
			
			var atom = {};
			var reader = self.getReader( data, start );			
			atom.startByte = reader.position();
			var markerWidth = readKeyLength(reader);
			var marker = reader.readBytes( markerWidth );
			atom.key = util.bytesToHex( marker ).join(' ');
			atom.id = codeKeys[atom.key] ? codeKeys[atom.key] : atom.key;
			atom.size = readVSizeByte( reader );
			
			
			//console.log('Bit String',  bitstr );
			//console.log('ATOM SIZE',  atom.size );
			
			
			atom.dataStart = reader.position();
			atom.endByte = atom.dataStart + atom.size;
			atom.type = listKeys.indexOf(atom.key) != -1 ? 'list' : 'data';
			
			next( atom );
			
		});
		
	};
	
	
	var headerCodeKeys = {
		'XX': 'XX',
		"82": 'docType',
		'87': 'doctypeVersion',
		'85': 'doctypeReadVersion',
		'86': 'EMBLVersion',
		'F7': 'EMBLReadVersion',
		'F2': 'EMBLMaxIDLength',
		'F3': 'EMBLMaxStringLength'
	};
	
	exports.readHeader = function( callback ){
		var self = this;
		console.log('readHeader');
		self.getDataBuffer( 0, 200, function( data ){
			var reader = self.getReader( data, 0 );
			var hex = util.bytesToHex( reader.readBytes(4) );
			console.log( 'HEX', hex );
			console.log( hex.join(' ') );
			if( hex.join(' ') == '1A 45 DF A3' ){
				console.log('IS VALID EBML HEADER');
				var header = {};
				var typeFlag = util.byteToHex( reader.readByte() );
				if(typeFlag == '93'){
					console.log( 'MATROSKA 93' );
					while( util.byteToHex(reader.readByte()) == '42'){
						var code = util.byteToHex(reader.readByte());
						if(headerCodeKeys[code]){
							var key = headerCodeKeys[code];
							var size = readVSizeByte(reader);							
							if(key == 'docType'){
								exports.header[key] = reader.readString( size );
							}else{
								exports.header[key] = reader['readUint'+( size * 8)]();
							}
						}
					}
					reader.seek(-1);
				}
				
			}
			exports.header.length = reader.position();
			console.log('HEADER', exports.header );
			callback(exports.header);
		});
	};
	
	exports.foundHook = function( atom, callback ){
		var self = this;
		
		if(atom.size == 1 && atom.id.indexOf(':') === -1 ){
			 atom.id += ':Uint';
		}

		if(atom.type == 'data' && atom.id.indexOf(':') !== -1){
			var idParts = atom.id.split(':');
			atom.id = idParts.shift();
			
			if( idParts.length > 0 ){
				atom.varType = idParts.shift();
				self._source.readAsBuffer( atom.dataStart, atom.endByte, function( data ){
					var reader = self.getReader( data, atom.dataStart );
					if(atom.varType == 'String'){
						atom.value = reader.readString( atom.size );
					}else if(atom.varType == 'Uint'){
						atom.value = readUint(reader, atom.size);
						//console.log(atom.id, atom.size, atom.value);
					}else if(atom.varType == 'Float'){
						var floatArr = new Float32Array(data);
						var freader = self.getReader( floatArr.buffer, 0 );
						atom.value = freader.readFloat32(); 
					}
					callback();
				});
			}
			
		}else{
			callback();
		}
		
		return self.foundAtom( atom );
		
	};
	
	exports.parseComplete = function( atoms ){
		
		console.log('PARSE COMPLETE', atoms );
		var metadata = {};
		var segment = atoms.Segment;
		var segmentInfo = segment.SegmentInfo;
		var tracks = segment.Tracks;
				
		var timeCodeScale = segmentInfo.TimecodeScale;
		
		metadata.binaryLanguage = 'EBML Extensible Binary Markup Language';
		metadata.title = segmentInfo.Title;
	
		metadata.writer = segmentInfo.WritingApp;
		metadata.muxer = segmentInfo.MuxingApp;
		
		metadata.seconds = ( segmentInfo.Duration * timeCodeScale ) / 999999999;
		metadata.duration =  mediaUtil.secondsToTimecode(metadata.seconds);
		
		metadata.frameRate = '';
		//metadata.frames = 1000000000 / DefaultDuration ;
				
		for( var trackName in tracks ){
			var track = tracks[trackName];
			if(track.Video){
				if(!metadata.video){
					metadata.video = {};
					metadata.video.height = metadata.height = track.Video.PixelHeight;
					metadata.video.width = metadata.width = track.Video.PixelWidth;
					metadata.video.interlaced = track.Video.FlagInterlaced;
					metadata.video.codec_id = track.CodecID;
					if( mastrokiaCodecs[track.CodecID] ){
						metadata.video.codec = mastrokiaCodecs[track.CodecID].name;
					}
					metadata.video.fps = metadata.fps = 1 / ( track.DefaultDuration / 1000000000 );
					metadata.video.frames = metadata.frames = metadata.video.fps * metadata.seconds;
				}
			}else if(track.Audio){
				if(!metadata.audio){
					metadata.audio = {};
					metadata.audio.channels = track.Audio.Channels;
					metadata.audio.frequency = track.Audio.SamplingFrequency+'Hz';
					metadata.audio.outputFrequency = track.Audio.OutputSamplingFrequency+'Hz';
					metadata.audio.codec_id = track.CodecID;
					if( mastrokiaCodecs[track.CodecID] ){
						metadata.audio.codec = mastrokiaCodecs[track.CodecID].name;
					}
					metadata.audio.language = track.Language;
					
					metadata.audio.frames = track.DefaultDuration / 1000000000;
				}
			}else{
				if(track.CodecID == "S_TEXT/UTF8"){
					metadata.subtitles = {};
					metadata.subtitles.language = track.Language;
				}
			}
		}
		
		this.metadata = metadata;
	};
	
	exports.findAtoms = function( start, end, callback ){
		
		var self = this;
		
		var continueParse = function(){
			//if(self.atoms.length > 30) return false;
			if(start >= self._source.size)
				return self.compileAtoms();
			
			self.identifyAtomAt( start, function( atom ){
				start = atom.type == 'list' ? atom.dataStart : atom.endByte;
				
				exports.foundHook(atom, function(){
					continueParse();
				});
				
			});
			
		};
		
		continueParse();
	};
	
	return exports;
	
});