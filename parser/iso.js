define('media/parser/iso', [ 'media/parser/base', 'file/reader', 'utils', 'media/util', 'binary/util' ], function( parserBase, reader, utils, mediaUtil, binUtil ){
/*
    "vmhd": "video information media header",
    "mvhd": 'movie header',
    "tkhd": 'track header',
    "mdhd": 'media header', # The media header atom specifies the characteristics of a media, including time scale and duration
    "smhd": 'sound media information header', 
    "hdlr": 'handler reference', # The handler reference atom specifies the media handler component that is to be used to interpret the media’s data
    "stsd": "sample description", # The sample description atom contains a table of sample descriptions
    "stts": "time-to-sample", # Time-to-sample atoms store duration information for a media’s samples, providing a mapping from a time in a media to the corresponding data sample
    "stsc": "sample-to-chunk", # The sample-to-chunk atom contains a table that maps samples to chunks
    "stco": 'chunk offset', # Chunk offset atoms identify the location of each chunk of data
    "stsz": 'sample size', # You use sample size atoms to specify the size of each sample
    "ctts": 'composition offset', # The composition offset bnv  atom contains a sample-by-sample mapping of the decode-to-presentation time
    "stss": "sync sample", # The sync sample atom identifies the key frames
*/

	var objectTypes = {
		 1: "system v1",
		 2: "system v2",
         32: "MPEG-4 video",
         33: "MPEG-4 AVC SPS",
         34: "MPEG-4 AVC PPS", 
         64: "MPEG-4 audio",
         96: "MPEG-2 simple video",
         97: "MPEG-2 main video",
         98: "MPEG-2 SNR video",
         99: "MPEG-2 spatial video",
         100: "MPEG-2 high video",
         101: "MPEG-2 4:2:2 video",
         102: "MPEG-4 ADTS main",
         103: "MPEG-4 ADTS Low Complexity",
         104: "MPEG-4 ADTS Scalable Sampling Rate",
         105: "MPEG-2 ADTS",
         106: "MPEG-1 video",
         107: "MPEG-1 ADTS",
         108: "JPEG video",
         192: "private audio",
         208: "private video",
         224: "16-bit PCM LE audio", 
         225: "vorbis audio",
         226: "dolby v3 (AC3) audio",
         227: "alaw audio",
         228: "mulaw audio",
         229: "G723 ADPCM audio",
         230: "16-bit PCM Big Endian audio",
         240: "Y'CbCr 4:2:0 (YV12) video",
         241: "H264 video",
         242: "H263 video",
         243: "H261 video"
	};

	var exports = Object.create( parserBase );
	
	exports.ignore = [''];
	exports.MAX_DATA_IMPORT = 1048576/2;
	
	exports.dataAtoms = ['mdat'];
	
	var codecTypeCodes = {
		'cvid': 'Cinepak',
		'jpeg': 'JPEG',
		'smc ': 'Graphics',
		'rle ': 'Animation',
		'rpza': 'Apple video',
		'kpcd': 'Kodak Photo CD',
		'png ': 'Portable Network Graphics',
		'mjpa': 'Motion-JPEG (format A)',
		'mjpb': 'Motion-JPEG (format B)',
		'SVQ1': 'Sorenson video, version 1',
		'SVQ3': 'Sorenson video 3',
		'mp4v': 'MPEG-4 Video',
		'avc1': 'h264',
		'dvc ': 'NTSC DV-25 Video',
		'dvcp': 'PAL DV-25 Video',
		'gif ': 'CompuServe Graphics Interchange Format',
		'h263': 'H.263',
		'tiff': 'Tagged Image File Format',
		'raw ': 'Uncompressed RGB',
		'2vuY': 'Uncompressed Y´CbCr, 8-bit-per-component 4:2:2',
		'yuv2': 'Uncompressed Y´CbCr, 8-bit-per-component 4:2:2',
		'v308': 'Uncompressed Y´CbCr, 8-bit-per-component 4:4:4',
		'v408': 'Uncompressed Y´CbCr, 8-bit-per-component 4:4:4:4',
		'v216': 'Uncompressed Y´CbCr, 10, 12, 14, or 16-bit-per-component 4:2:2',
		'v410': 'Uncompressed Y´CbCr, 10-bit-per-component 4:4:4',
		'v210': 'Uncompressed Y´CbCr, 10-bit-per-component 4:2:2',
	};
	
	var audioTypeCodes = {
		'raw ': "Uncompressed",
		'twos': "Uncompressed, in two’s-complement format (sample values range from -128 to 127 for 8-bit audio, and -32768 to 32767 for 1- bit audio; 0 is always silence). These samples are stored in 16-bit big-endian format.",
		'sowt': "16-bit little-endian, twos-complement",
		'MAC3 ': "Samples have been compressed using MACE 3:1. (Obsolete.)",
		'MAC6 ': "Samples have been compressed using MACE 6:1. (Obsolete.)",
		'ima4': "Samples have been compressed using IMA 4:1.",
		'fl32': "32-bit floating point",
		'fl64': "64-bit floating point",
		'in24': "24-bit integer",
		'in32': "32-bit integer",
		'ulaw': "uLaw 2:1",
		'alaw': "uLaw 2:1",
		'dvca': "DV Audio",
		'QDMC': "QDesign music",
		'QDM2': "QDesign music version 2",
		'Qclp': "QUALCOMM PureVoice",
		'.mp3': "MPEG-1 layer 3, CBR & VBR (QT4.1 and later)",
		'mp4a': "AAC",
		'ac-3': "Digital Audio Compression Standard (AC-3, Enhanced AC-3)",
	};
	
	var brandCodes = {
	'3g2a': { code: '3g2a', abstract: "3GPP2", brand: "3GPP2" }, 
	'3ge6': { code: '3ge6', abstract: "3GPP Release 6 extended-presentation Profile", brand: "3GPP" }, 
	'3ge9': { code: '3ge9', abstract: "3GPP Release 9 Extended Presentation Profile", brand: "3GPP" }, 
	'3gf9': { code: '3gf9', abstract: "3GPP Release 9 File-delivery Server Profile", brand: "3GPP" }, 
	'3gg6': { code: '3gg6', abstract: "3GPP Release 6 General Profile", brand: "3GPP" }, 
	'3gg9': { code: '3gg9', abstract: "3GPP Release 9 General Profile", brand: "3GPP" }, 
	'3gh9': { code: '3gh9', abstract: "3GPP Release 9 Adaptive Streaming Profile", brand: "3GPP" }, 
	'3gm9': { code: '3gm9', abstract: "3GPP Release 9 Media Segment Profile", brand: "3GPP" }, 
	'3gp4': { code: '3gp4', abstract: "3GPP Release 4", brand: "3GPP" }, 
	'3gp5': { code: '3gp5', abstract: "3GPP Release 5", brand: "3GPP" }, 
	'3gp6': { code: '3gp6', abstract: "3GPP Release 6 basic Profile", brand: "3GPP" }, 
	'3gp7': { code: '3gp7', abstract: "3GPP Release 7", brand: "3GPP" }, 
	'3gp8': { code: '3gp8', abstract: "3GPP Release 8", brand: "3GPP" }, 
	'3gp9': { code: '3gp9', abstract: "3GPP Release 9 Basic Profile", brand: "3GPP" }, 
	'3gr6': { code: '3gr6', abstract: "3GPP Release 6 progressive-download Profile", brand: "3GPP" }, 
	'3gr9': { code: '3gr9', abstract: "3GPP Release 9 Progressive DownloadProfile", brand: "3GPP" }, 
	'3gs6': { code: '3gs6', abstract: "3GPP Release 6 streaming-server Profile", brand: "3GPP" }, 
	'3gs9': { code: '3gs9', abstract: "3GPP Release 9 Streaming ServerProfile", brand: "3GPP" }, 
	'3gt9': { code: '3gt9', abstract: "3GPP Release 9 Media Stream Recording Profile", brand: "3GPP" }, 
	'ARRI': { code: 'ARRI', abstract: "ARRI Digital Camera", brand: "ARRI" }, 
	'avc1': { code: 'avc1', abstract: "Advanced Video Coding extensions", brand: "ISO" }, 
	'bbxm': { code: 'bbxm', abstract: "Blinkbox Master File: H.264 video and 16-bit little-endian LPCM audio", brand: "Blinkbox" }, 
	'CAEP': { code: 'CAEP', abstract: "Canon Digital Camera", brand: "Canon" }, 
	'caqv': { code: 'caqv', abstract: "Casio Digital Camera", brand: "Casio" }, 
	'ccff': { code: 'ccff', abstract: "Common container file format", brand: "DECE" }, 
	'CDes': { code: 'CDes', abstract: "Convergent Designs", brand: "Convergent" }, 
	'da0a': { code: 'da0a', abstract: "DMB AF audio with MPEG Layer II audio, MOT slide show, DLS, JPG/PNG/MNG images", brand: "DMB-MAF" }, 
	'da0b': { code: 'da0b', abstract: "DMB AF, extending da0a , with 3GPP timed text, DID, TVA, REL, IPMP", brand: "DMB-MAF" }, 
	'da1a': { code: 'da1a', abstract: "DMB AF audio with ER-BSAC audio, JPG/PNG/MNG images", brand: "DMB-MAF" }, 
	'da1b': { code: 'da1b', abstract: "DMB AF, extending da1a, with 3GPP timed text, DID, TVA, REL, IPMP", brand: "DMB-MAF" }, 
	'da2a': { code: 'da2a', abstract: "DMB AF audio with HE-AAC v2 audio, MOT slide show, DLS, JPG/PNG/MNG images", brand: "DMB-MAF" }, 
	'da2b': { code: 'da2b', abstract: "DMB AF extending da2a, with 3GPP timed text, DID, TVA, REL, IPMP", brand: "DMB-MAF" }, 
	'da3a': { code: 'da3a', abstract: "DMB AF audio with HE-AAC, JPG/PNG/MNG images", brand: "DMB-MAF" }, 
	'da3b': { code: 'da3b', abstract: "DMB AF extending da3a with BIFS, 3GPP timed text, DID, TVA, REL, IPMP", brand: "DMB-MAF" }, 
	'dash': { code: 'dash', abstract: "ISO base media file format file specifically designed for DASH including movie fragments and Segment Index.", brand: "DASH" }, 
	'dby1': { code: 'dby1', abstract: "MP4 files with Dolby content (e.g. Dolby AC-4, Dolby Digital Plus, Dolby TrueHD (Dolby MLP))", brand: "Dolby" }, 
	'dsms': { code: 'dsms', abstract: "Media Segment conforming to the DASH Self-Initializing Media Segment format type for ISO base media file format", brand: "DASH" }, 
	'dmb1': { code: 'dmb1', abstract: "DMB AF supporting all the components defined in the specification", brand: "DMB-MAF" }, 
	'dv1a': { code: 'dv1a', abstract: "DMB AF video with AVC video, ER-BSAC audio, BIFS, JPG/PNG/MNG images, TS", brand: "DMB-MAF" }, 
	'dv1b': { code: 'dv1b', abstract: "DMB AF, extending dv1a, with 3GPP timed text, DID, TVA, REL, IPMP", brand: "DMB-MAF" }, 
	'dv2a': { code: 'dv2a', abstract: "DMB AF video with AVC video, HE-AACv2 audio, BIFS, JPG/PNG/MNG images, TS", brand: "DMB-MAF" }, 
	'dv2b': { code: 'dv2b', abstract: "DMB AF extending dv2a, with 3GPP timed text, DID, TVA, REL, IPMP", brand: "DMB-MAF" }, 
	'dv3a': { code: 'dv3a', abstract: "DMB AF video with AVC video, HE-AAC audio, BIFS, JPG/PNG/MNG images, TS", brand: "DMB-MAF" }, 
	'dv3b': { code: 'dv3b', abstract: "DMB AF extending dv3a with 3GPP timed text, DID, TVA, REL, IPMP", brand: "DMB-MAF" }, 
	'dvr1': { code: 'dvr1', abstract: "DVB RTP", brand: "DVB" }, 
	'emsg': { code: 'emsg', abstract: "Event message box present", brand: "DASH" }, 
	'dvt1': { code: 'dvt1', abstract: "DVB Transport Stream", brand: "DVB" }, 
	'ifrm': { code: 'ifrm', abstract: "Apple iFrame Specification, Version 8.1 Jan 2013", brand: "Apple" }, 
	'isc2': { code: 'isc2', abstract: "Files encrypted according to ISMACryp 2.0", brand: "ISMACryp2" }, 
	'iso2': { code: 'iso2', abstract: "All files based on the 2004 edition of the ISO file format", brand: "ISO" }, 
	'iso3': { code: 'iso3', abstract: "Version of the ISO file format", brand: "ISO" }, 
	'iso4': { code: 'iso4', abstract: "Version of the ISO file format", brand: "ISO" }, 
	'iso5': { code: 'iso5', abstract: "Version of the ISO file format", brand: "ISO" }, 
	'iso6': { code: 'iso6', abstract: "Version of the ISO file format", brand: "ISO" }, 
	'isom': { code: 'isom', abstract: "All files based on the ISO Base Media File Format", brand: "ISO" }, 
	'jp2 ': { code: 'jp2 ', abstract: "JPEG2000 Part 1", brand: "JP2000" }, 
	'jpx ': { code: 'jpx ', abstract: "JPEG2000 Part 2", brand: "JPX" }, 
	'jpm ': { code: 'jpm ', abstract: "JPEG 2000 Part 6 Compound Images", brand: "JPM" }, 
	'J2P0': { code: 'J2P0', abstract: "JPEG2000 Profile 0", brand: "JP2000" }, 
	'J2P1': { code: 'J2P1', abstract: "JPEG2000 Profile 1", brand: "JP2000" }, 
	'jpxb': { code: 'jpxb', abstract: "JPEG XR", brand: "JPXR" }, 
	'jpsi': { code: 'jpsi', abstract: "The JPSearch data interchange format, for the exchange of image collections and respective metadata", brand: "JPSearch" }, 
	'LCAG': { code: 'LCAG', abstract: "Leica digital camera", brand: "Leica" }, 
	'lmsg': { code: 'lmsg', abstract: "last Media Segment indicator for ISO base media file format.", brand: "DASH" }, 
	'M4P ': { code: 'M4P ', abstract: "MPEG-4 protected audio", brand: "iTunes" }, 
	'M4V ': { code: 'M4V ', abstract: "MPEG-4 protected audio+video", brand: "iTunes" }, 
	'MFSM': { code: 'MFSM', abstract: "Media File for Samsung video Metadata", brand: "Samsung" }, 
	'mj2s': { code: 'mj2s', abstract: "Motion JPEG 2000 simple profile", brand: "MJ2" }, 
	'mjp2': { code: 'mjp2', abstract: "Motion JPEG 2000, general profile", brand: "MJ2" }, 
	'mp21': { code: 'mp21', abstract: "MPEG-21", brand: "MPEG-21" }, 
	'mp41': { code: 'mp41', abstract: "MP4 version 1", brand: "MP4v2" }, 
	'mp42': { code: 'mp42', abstract: "MP4 version 2", brand: "MP4v2" }, 
	'mp71': { code: 'mp71', abstract: "MPEG-7 file-level metadata", brand: "ISO" }, 
	'MPPI': { code: 'MPPI', abstract: "Photo Player Multimedia Application Format", brand: "ISO-MAF" }, 
	'msdh': { code: 'msdh', abstract: "Media Segment conforming to the general format type for ISO base media file format.", brand: "DASH" }, 
	'msix': { code: 'msix', abstract: "Media Segment conforming to the Indexed Media Segment format type for ISO base media file format.", brand: "DASH" }, 
	'niko': { code: 'niko', abstract: "Nikon Digital Camera", brand: "Nikon" }, 
	'odcf': { code: 'odcf', abstract: "OMA DCF (DRM Content Format)", brand: "OMA DRM 2.0" }, 
	'opf2': { code: 'opf2', abstract: "OMA PDCF (DRM Content Format)", brand: "OMA DRM 2.1" }, 
	'opx2': { code: 'opx2', abstract: "OMA Adapted PDCF", brand: "OMA DRM XBS" }, 
	'pana': { code: 'pana', abstract: "Panasonic Digital Camera", brand: "Panasonic" }, 
	'piff': { code: 'piff', abstract: "Protected Interoperable File Format", brand: "PIFF" }, 
	'pnvi': { code: 'pnvi', abstract: "Panasonic Video Intercom", brand: "Panasonic Video Intercom" }, 
	'qt  ': { code: 'qt  ', abstract: "QuickTime", brand: "QT" }, 
	'risx': { code: 'risx', abstract: "Representation Index Segment used to index MPEG-2 TS based Media Segments.", brand: "DASH" }, 
	'ROSS': { code: 'ROSS', abstract: "Ross Video", brand: "Ross" }, 
	'sdv ': { code: 'sdv ', abstract: "SD Video", brand: "SDV" }, 
	'sims': { code: 'sims', abstract: "Media Segment conforming to the Sub-Indexed Media Segment format type for ISO base media file format.", brand: "DASH" }, 
	'sisx': { code: 'sisx', abstract: "Single Index Segment used to index MPEG-2 TS based Media Segments.", brand: "DASH" }, 
	'ssss': { code: 'ssss', abstract: "Subsegment Index Segment used to index MPEG-2 TS based Media Segments.", brand: "DASH" },
};
	
	// JavaScript Document
var iTunesCodes = {
	'©alb': { name: "Album", flag: 1, dataType: "text", itunes_v: "iTunes 4.0"  },
	'©art': { name: "Artist", flag: 1, dataType: "text", itunes_v: "iTunes 4.0"  },
	'aART': { name: "Album Artist", flag: 1, dataType: "text", itunes_v: "??"  },
	'©cmt': { name: "Comment", flag: 1, dataType: "text", itunes_v: "iTunes 4.0"  },
	'©day': { name: "Year", flag: 1, dataType: "text", itunes_v: "iTunes 4.0"  },
	'©nam': { name: "Title", flag: 1, dataType: "text", itunes_v: "iTunes 4.0"  },
	'©gen | gnre':  { name: "Genre", flag: 0, dataType: "text | uint8", itunes_v: "iTunes 4.0"  },
	'trkn': { name: "Track number", flag: 0, dataType: "uint8", itunes_v: "iTunes 4.0"  },
	'disk': { name: "Disk number", flag: 0, dataType: "uint8", itunes_v: "iTunes 4.0"  },
	'©wrt': { name: "Composer", flag: 1, dataType: "text", itunes_v: "iTunes 4.0"  },
	'©too': { name: "Encoder", flag: 1, dataType: "text", itunes_v: "iTunes 4.0"  },
	'tmpo':  { name: "BPM", flag: 21, dataType: "uint8", itunes_v: "iTunes 4.0"  },
	'cprt':  { name: "Copyright", flag: 1, dataType: "text", itunes_v: "? iTunes 4.0"  },
	'cpil':  { name: "Compilation", flag: 21, dataType: "uint8", itunes_v: "iTunes 4.0"  },
	'covr': { name:  "Artwork", flag: 13142, dataType: "jpeg | png", itunes_v: "iTunes 4.0"  },
	'rtng': { name:  "Rating/Advisory", flag: 21, dataType: "uint8", itunes_v: "iTunes 4.0"  },
	'©grp': { name:  "Grouping", flag: 1, dataType: "text", itunes_v: "iTunes 4.2"  },
	'stik': { name:  "?? (stik)", flag: 21, dataType: "uint8", itunes_v: "??"  },
	'pcst': { name:  "Podcast", flag: 21, dataType: "uint8", itunes_v: "iTunes 4.9"  },
	'catg': { name:  "Category", flag: 1, dataType: "text", itunes_v: "iTunes 4.9"  },
	'keyw': { name:  "Keyword", flag: 1, dataType: "text", itunes_v: "iTunes 4.9"  },
	'purl': { name:  "Podcast URL", flag: 21, dataType: "uint8", itunes_v: "iTunes 4.9"  },
	'egid': { name:  "Episode Global Unique ID", flag: 21, dataType: "uint8", itunes_v: "iTunes 4.9"  },
	'desc': { name:  "Description", flag: 1, dataType: "text", itunes_v: "iTunes 5.0"  },
	'©lyr': { name:  "Lyrics", flag: 13, dataType: "text", itunes_v: "iTunes 5.0"  },
	'tvnn': { name:  "TV Network Name", flag: 1, dataType: "text", itunes_v: "iTunes 6.0"  },
	'tvsh': { name:  "TV Show Name", flag: 1, dataType: "text", itunes_v: "iTunes 6.0"  },
	'tven': { name:  "TV Episode Number", flag: 1, dataType: "text", itunes_v: "iTunes 6.0"  },
	'tvsn': { name:  "TV Season", flag: 21, dataType: "uint8", itunes_v: "iTunes 6.0"  },
	'tves': { name: "TV Episode", flag: 21, dataType: "uint8", itunes_v: "iTunes 6.0"  },
	'purd': { name:  "Purchase Date", flag: 1, dataType: "text", itunes_v: "iTunes 6.0.2"  },
	'pgap': { name:  "Gapless Playback", flag: 21, dataType: "uin8", itunes_v: "iTunes 7.0"  }
};

var nalUnitTypeCodes = {
	0: { type: 'Unspecified', format: '' },
	1: { type: 'Coded slice of a non-IDR picture', format: 'slice_layer_without_partitioning_rbsp(' },
	2: { type: 'Coded slice data partition A', format: 'slice_data_partition_a_layer_rbsp' },
	3: { type: 'Coded slice data partition B', format: 'slice_data_partition_b_layer_rbsp' },
	4: { type: 'Coded slice data partition C', format: 'slice_data_partition_c_layer_rbsp' },
	5: { type: 'Coded slice of an IDR picture', format: 'slice_layer_without_partitioning_rbsp' },
	6: { type: 'Supplemental enhancement information (SEI)', format: 'sei_rbsp' },
	7: { type: 'Sequence parameter set', format: 'seq_parameter_set_rbsp' },
	8: { type: 'Picture parameter set', format: 'pic_parameter_set_rbsp' },
	9: { type: 'Access unit delimiter', format: 'access_unit_delimiter_rbsp' },
	10: { type: 'End of sequence', format: 'end_of_seq_rbsp' },
	11: { type: 'End of stream', format: 'end_of_stream_rbsp' },
	12: { type: 'Filler data', format: 'filler_data_rbsp' },
	13: { type: 'Sequence parameter set extension',  format: 'seq_parameter_set_extension_rbsp' },
	14: { type: 'Prefix NAL unit', format: 'prefix_nal_unit_rbsp' },
	15: { type: 'Subset sequence parameter set', format: 'subset_seq_parameter_set_rbsp' },
	19: { type: 'Coded slice of an auxiliary coded picture without partitioning', format: 'slice_layer_without_partitioning_rbsp' },
	20: { type: 'Coded slice extension', format: 'slice_layer_extension_rbsp' },
	21: { type: 'Coded slice extension for depth view components', format: 'slice_layer_extension_rbsp' }
};


	var AudioSampleEntry = function( reader, data ){
		
	};
	var VisualSampleEntry = function( reader ){
		
	};
	var HintSampleEntry = function( reader ){
		var data = readBox( reader );
	};
	
	var SampleEntry = function( reader ){
		var data = readBox( reader );
		data.reserved = reader.readBytes(6);
		data.reference_index = reader.readUint16();
		return data;
	};
	
	var readFormatted = {
		
		seq_parameter_set_rbsp: function( reader ){
			
		}
		
	};

	var langTypeCodes = {
		5575: 'English',
		6721: 'French',
		4277: 'German',
		19969: 'Spanish',
		16882: 'Portuguese'
	};
	
	var readUEV = function(_bits){
 		var bcount = _bits.length;
 		console.log('readUEV',_bits);
 		var vals = [];
 		while(_bits.length > 0 && vals[0] == 0 ) 
 			vals[0] = _bits.shift();
 			
 		var zcount = bcount - _bits.length;
 		console.log(zcount);
 		while( vals.length <= zcount+1 ){
 			vals.push(_bits.shift());
 		}
 		console.log(vals);
 		return parseInt( vals.reverse().join(''), 2 );
 };
 	
 	var readSEV = function(_bits){
 		var bcount = _bits.length;
 		console.log('readUEV',_bits);
 		var vals = [];
 		while(_bits.length > 0 && vals[0] == 0 ) 
 			vals[0] = _bits.shift();
 			
 		var zcount = bcount - _bits.length;
 		console.log(zcount);
 		while( vals.length <= zcount+1 ){
 			vals.push(_bits.shift());
 		}
 		console.log(vals);
 		return parseInt( vals.join(''), 2 );
 	};
	
	var read_bits = function( bits, n ){
		if(bits.length < n){
			console.log('bits shorter than n');
		}
		var readBits = [];
		while(readBits.length < n) 
			readBits.push(bits.shift());
		console.log(readBits.join(''));
		return parseInt( readBits.join(''), 2 );
	};
	
	var read_ubits = function( bits, n ){
		if(bits.length < n){
			console.log('bits shorter than n');
		}
		var readBits = [];
		while(readBits.length < n) 
			readBits.push(bits.shift());
		console.log(readBits.join(''));
		return parseInt( readBits.reverse().join(''), 2 );
	};
	
	var next_bits = function( reader, n ){
		var bytes = Math.ceil( n/8 );
		var b = reader.readBits(bytes*8);
		reader.seek(-bytes);
		return parseInt( b.join(''), 2 );
		
	};
	
	var vui_parameters = function( bits, set ){
		
		set.vui = {};
		
		set.vui.FLAG_aspect_ratio_info_present_flag = read_bits(bits, 1);
		
		if ( set.vui.FLAG_aspect_ratio_info_present_flag ){  //aspect_ratio_info_present_flag
			
			set.vui.aspect_ratio_idc = read_bits(bits, 8);
			
			switch( set.aspect_ratio_idc ){
				case 255:
              		set.vui.sar_width  = read_ubits(bits, 16);
              		set.vui.sar_height = read_ubits(bits, 16);
              	break;
              	default:
              		set.vui.sar_width  = read_bits(bits, 16);
              		set.vui.sar_height = read_bits(bits, 16);
  			}
		}else
          set.vui.sar_width = set.vui.sar_height = 0;
          
         set.vui.FLAG_overscan_info_present_flag = read_bits(bits, 1);
     if ( set.vui.FLAG_overscan_info_present_flag ) //overscan_info_present_flag
          set.vui.overscan_appropriate_flag = read_bits(bits, 1); //overscan_appropriate_flag
  
  		set.vui.FLAG_video_signal_type_present_flag = read_bits(bits, 1);
      if (set.vui.FLAG_video_signal_type_present_flag) //video_signal_type_present_flag
      {
        set.vui.video_format = read_bits(bits, 3); //video_format
        set.vui.video_full_range_flag =  read_bits(bits, 1);  //video_full_range_flag
          
          set.vui.FLAG_colour_description_present_flag = read_bits(bits, 1);
          if ( set.vui.FLAG_colour_description_present_flag ) // colour_description_present_flag
         {
              set.vui.colour_primaries = read_bits(bits, 8); // colour_primaries
              set.vui.transfer_characteristics = read_bits(bits, 8); // transfer_characteristics
              set.vui.matrix_coefficients = read_bits(bits, 8); // matrix_coefficients
          }
      }
      
      set.vui.FLAG_chroma_loc_info_present_flag = read_bits(bits,1);
      if ( set.vui.FLAG_chroma_loc_info_present_flag ){
         set.vui.chroma_sample_loc_type_top_field = readUEV(bits); //chroma_sample_loc_type_top_field ue(v)
         set.vui.chroma_sample_loc_type_bottom_field = readUEV(bits); //chroma_sample_loc_type_bottom_field ue(v)
      }
		set.vui.FLAG_timing_info_present_flag = read_bits(bits,1);
      if ( set.vui.FLAG_timing_info_present_flag ){
         set.vui.unitsInTick = read_bits(bits, 32); //num_units_in_tick
         set.vui.timeScale = read_bits(bits, 32);   //time_scale
         set.vui.fixedRate = read_bits(bits,1);
      }

        
	};
	
	var read_nal_unit = function( reader ){
		var data = {};
		data.length = reader.readUint16();
		console.log('read_nal_unit', reader.bytesLeft());
		var bits = reader.readBits( 8 );
		bits.shift(); //Forbidden
		data.nal_ref_idc = read_bits( bits, 2 );
	 	data.nal_unit_type = read_bits( bits, 5 );
	 	data.nal_unit_type_name = nalUnitTypeCodes[data.nal_unit_type];
	 	var rbsp_bytes = reader.readBits( 8 * data.length );	 	
	 	console.log('NAL', rbsp_bytes);
	 	data.units = [];
	 	while(rbsp_bytes.length > 24 && next_bits( reader, 24 ) !== 0x000003){
	 	/*
	 	for( var i=1; i<BYTES_IN_NAL_UNIT;i++){
	 		if( i + 2 < BYTES_IN_NAL_UNIT && next_bits( reader, 24 ) == 0x000003 ) {
				rbsp_bytes = rbsp_bytes.concat(reader.readBits( 2 * 8 ));
 				i += 2
//emulation_prevention_three_byte /* equal to 0x03  All f(8)
 			} else{
 			rbsp_bytes = rbsp_bytes.concat(reader.readBits( 8 ));

 			}
	 	}
	 	*/
	 	console.log('rbsp_bytes',rbsp_bytes.join(''));
	 	
	 	switch( data.nal_unit_type ){
	 		case 7:
	 		data.units[data.units.length] = {};
	 		read_sequence_paramiter_set( reader, data.units[data.units.length-1] , rbsp_bytes );
	 		break;
	 	}
	 	
	 	 console.log( 'Bits Left', rbsp_bytes );
	 	}
		return data;
	};
	
	var BYTES_IN_NAL_UNIT = null;
	
	var read_sequence_paramiter_set = function( reader, set, bits ){
	 	
	 	set.profile_idc = read_bits(bits, 8);

	 	set.constraint_flag_0 = read_bits( bits, 1 );
	 	set.constraint_flag_1 = read_bits( bits, 1 );
	 	set.constraint_flag_2 = read_bits( bits, 1 );
	 	set.constraint_flag_3 = read_bits( bits, 1 );
	 	set.constraint_flag_4 = read_bits( bits, 1 );
	 	read_bits(bits, 3);
	 	
		set.level_idc = read_bits(bits, 8).toString().split('').join('.');
		set.seq_parameter_set_id = readUEV( bits );
		
		/*
		var high_profile_ids = [100, 110, 122, 244, 44, 83, 86, 118, 128];
		
		if(high_profile_ids.indexOf( set.profile_idc ) != -1){
			//High profile
			set.chroma_format_idc = readUEV( bits );
			if ( set.chroma_format_idc == 3 )
               	set.separate_colour_plane_flag = (read_bits(bits, 1) == 1);
				
			set.bit_depth_luma_minus8 = readUEV( bits );     // bit_depth_luma_minus8
			set.bit_depth_chroma_minus8 = readUEV( bits );     // bit_depth_chroma_minus8
			set.qpprime_y_zero_transform_bypass_flag = read_bits(bits, 1);         // qpprime_y_zero_transform_bypass_flag
			set.seq_scaling_matrix_present_flag = read_bits(bits, 1);
        
            if (set.seq_scaling_matrix_present_flag){
               for (var idx = 0; idx < ((set.chroma_format_idc != 3) ? 8 : 12); ++idx){
                   set.scaling_list_present = read_bits(bits, 1);
                   
                   if ( set.scaling_list_present){
                   	
                       set.lastScale = set.nextScale = 8;
                       var sl_n = ((idx < 6) ? 16 : 64);
                       
                       for(var sl_i = 0; sl_i < sl_n; ++sl_i){
                           if (set.nextScale != 0){
                               set.deltaScale = readSEV( bits ); 
                               set.nextScale = (set.lastScale + set.deltaScale + 256) % 256;
                           }
                           set.lastScale = (set.nextScale == 0) ? set.lastScale : set.nextScale;
                       }
                   }
               }
           }
  
		}
		*/
		set.pic_order_cnt_type = readUEV( bits );
		
		if( set.pic_order_cnt_type == 0 ){
			set.log2_max_pic_order_cnt_lsb_minus4 = readUEV( bits );
		}else if( set.pic_order_cnt_type == 1 ){
			set.delta_pic_order_always_zero_flag = read_bits( bits, 1 );
			set.offset_for_non_ref_pic = readSEV( bits );
			set.offset_for_top_to_bottom_field = readSEV( bits );
			set.num_ref_frames_in_pic_order_cnt_cycle = readUEV( bits );
			set.offset_for_ref_frame = [];
			for( i=0; i<set.num_ref_frames_in_pic_order_cnt_cycle;i++){
				set.offset_for_ref_frame[ i ] = readSEV( bits );
			}
		}
		
		set.num_ref_frames = readUEV( bits );
		set.gaps_in_frame_num_value_allowed_flag = read_bits( bits, 1 );
		set.pic_width_in_mbs_minus1 = readUEV( bits );
		set.pic_height_in_map_units_minus1 = readUEV( bits );
		set.pic_width = (set.pic_width_in_mbs_minus1 + 1) * 16;
		set.pic_height = (set.pic_height_in_map_units_minus1 + 1) * 16;
		
		
		set.frame_mbs_only_flag = read_bits( bits, 1 );
		
		if( !set.frame_mbs_only_flag ){
			set.pic_height *= 2;
			set.mb_adaptive_frame_field_flag = read_bits( bits, 1 );
		}
			
		set.direct_8x8_inference_flag = read_bits( bits, 1 );
		set.frame_cropping_flag = read_bits( bits, 1 );
		
		if( set.frame_cropping_flag ) { 
			set.frame_crop_left_offset = readUEV( bits );
			set.frame_crop_right_offset = readUEV( bits );
			set.frame_crop_top_offset = readUEV( bits );
			set.frame_crop_bottom_offset = readUEV( bits );
		}
		
		set.vui_parameters_present_flag = readUEV( bits );
		
		if(set.vui_parameters_present_flag){
			vui_parameters( bits, set );
		}
		//rbsp_trailing_bits( )
		
		/*
		var high_profile_id = [100, 110, 122, 244, 44, 83, 86, 118, 128];
		
		if(high_profile_id.indexOf( set.profile_idc )){
			//High profile		
			if ((chroma_format_idc = get_ue_golomb(gb)) == 3)
  834             separate_colour_plane_flag = (get_bits1(gb) == 1);
  835 
  836         get_ue_golomb(gb);     // bit_depth_luma_minus8
  837         get_ue_golomb(gb);     // bit_depth_chroma_minus8
  838         get_bits1(gb);         // qpprime_y_zero_transform_bypass_flag
  839 
  840         if (get_bits1(gb))     // seq_scaling_matrix_present_flag
  841         {
  842             for (int idx = 0; idx < ((chroma_format_idc != 3) ? 8 : 12); ++idx)
  843             {
  844                 if (get_bits1(gb)) // Scaling list present
  845                 {
  846                     lastScale = nextScale = 8;
  847                     int sl_n = ((idx < 6) ? 16 : 64);
  848                     for(int sl_i = 0; sl_i < sl_n; ++sl_i)
  849                     {
  850                         if (nextScale != 0)
  851                         {
  852                             deltaScale = get_se_golomb(gb);
  853                             nextScale = (lastScale + deltaScale + 256) % 256;
  854                         }
  855                         lastScale = (nextScale == 0) ? lastScale : nextScale;
  856                     }
  857                 }
  858             }
  859         }
  
		}
		*/
		set.log2_max_frame_num_minus4 = readUEV( bits );
		
		
		set.data = bits;
		return set;
	};
	
	
	exports.readers = {
		prfl: function( reader ){
			var data = {};
			
			return data;
		},
		ftyp: function( reader ){
			var data = {};
			data.major_brand = reader.readString(4);
			data.version = [reader.readInt8(), reader.readInt8(), reader.readInt8(), reader.readInt8()].join('');
			var compatible = [];
			while(reader.bytesLeft() > 0){
				compatible.push(reader.readString(4));
			}
			data.compatible = compatible;
			exports.header = data;
			return data;
		},
		ilst: function( reader, atom ){
			var data = {};
			while(reader.bytesLeft() > 0){
				var size = reader.readInt32();
				var key = reader.readString(4);
				var dsize = reader.readInt32();
				var dkey = reader.readString(4);
				var val;
				if(iTunesCodes[key]){
					key = iTunesCodes[key].name;
					val = reader.readString(dsize-8);
				}else{
					val = reader.readString(dsize-8);
				}
				
				console.log( size, key, val );
				
				data[key] = dkey+':'+val;
			}
			return data;
		},
		hdlr: function( reader, atom ){
			
			var data = {};
			if(atom.parent.id == 'meta'){
				data.version = reader.readByte();
				data.flags = reader.readBytes(3);
				reader.readInt32(); //predifined
				data.handelerType = reader.readString(4);
				
				if(data.handelerType == 'mdta'){
					
				}else if(data.handelerType == 'mdir'){
					//Itunes Metadata
					data.manufacturer = reader.readString(4);
					
					
				}else if(data.handelerType == 'mhlr'){
					//Itunes Metadata
					
				}
							
				data.trail = reader.bytesLeft();
			}else{
				data.version = reader.readString(1);
				data.flags = reader.readString(3);
				data.component_type = reader.readString(4);
				data.component_subtype = reader.readString(4);
				data.component_manufacturer = reader.readInt32();
				data.component_flags = reader.readInt32();
				data.component_flags_mask = reader.readInt32();
				data.component_name = reader.readString();
			}
			
			return data;
			
		},
		meta: function( reader ){
			
			var data = {};
			reader.readInt32(); //Reserved		
			/*	
			//Parse hdlr meta atom
			var hdlrLength = reader.readInt32();
			var hdlrLength = reader.readInt32();
			
			while( reader.bytesLeft() > 0){
				
				reader.trackMovement();
				var tagLength = reader.readInt32();
				var tag = reader.readString(4);
				data[tag] = {};
				data[tag].length = tagLength;
				data[tag].version = reader.readByte();
				data[tag].flags = reader.readBytes(3);
				var dataClass = data[tag].flags;
				reader.readInt32(); //Reserved
				reader.trackMovement();
				
				while(reader.getMovement() < tagLength){
					reader.skipNull();
					
				}
				
				/*
				switch(tag){
					case 'hdlr':
						data.hdlr = {};
						data.hdlr.version = reader.readByte();
						data.hdlr.flags = reader.readBytes(3);
						data.hdlr.predifined = reader.readInt32();
						data.hdlr.type = reader.readString(4);
						var strFinished = false;
						data.hdlr.name = '';
						while( reader.bytesLeft() > 0 && !strFinished ){
							if( reader.readByte() == 0 ){
								strFinished = true;
							}else{
								reader.seek(-1);
								var _char = reader.readString(1);
								data.hdlr.name += _char;
							}
						}
						reader.skipNull(4);
					break;
					case 'ilst':
					
					break;
					default:
					data.trail = reader.readString();
				}
				//console.log(JSON.stringify(data));
				
				
			}
			*/
			//data.dat = reader.readString(data.dl-4);
			//data.bytes = Array.prototype.slice.call( reader.readBytes(reader.bytesLeft()) )
			//data.trail = reader.readString();
			return data;
			
		},
		mdhd: function( reader ){
			var data = {};
			data.version = reader.readString(1);
			data.flags = reader.readString(3);
			data.creation_time = readDate( reader );;
			data.modification_time = readDate( reader );;
			data.time_scale = reader.readInt32();
			data.duration = reader.readInt32();
			data.language = langTypeCodes[reader.readInt16()];
			data.quality = reader.readInt16();
			data.seconds = data.duration/data.time_scale;
			return data;
		},
		mvhd: function( reader ){
			var data = {};
			data.version = reader.readUint8();
			data.flags = reader.readBits(24);
			if(data.version == 1){
				data.creation_time = readDate( reader, data.version );
				data.modification_time = readDate( reader, data.version );
				data.time_scale = reader.readInt32();
				data.duration = reader.readInt32();
			}else if(data.version == 0){
				data.creation_time = readDate( reader, data.version );
				data.modification_time = readDate( reader, data.version );
				data.time_scale = reader.readInt32();
				data.duration = reader.readInt32();
			}
			
			data.preferred_rate = readValue( 'FIXED:4', reader );
			data.preferred_volume = readValue( 'FIXED:2', reader );
			data.reserved = reader.readString(10);
			data.matrix = reader.readString(36);
			data.preview_time = reader.readInt32();
			data.preview_duration = reader.readInt32();
			data.poster_time = reader.readInt32();
			data.selection_time = reader.readInt32();
			data.selection_duration = reader.readInt32();
			data.current_time = reader.readInt32();
			data.next_track_id = reader.readInt32();
			return data;
		},
		esds: function( reader ){
			
			var readESDiscriptor = function( pre ){
				return {
					'discription_type': binUtil.byteToHex( reader.readByte() ),
					'extended_discription': reader.readHex(3),
					'discription_type_length': reader.readUint8()
				};
			};
			
			var data = { 
				version: reader.readInt8(),
				flags: reader.readBytes(3),
				es_discript: binUtil.byteToHex( reader.readByte() ),
				es_ex_discript: reader.readHex(3),
				descriptor_type_length: reader.readUint8(),
				es_id: reader.readUint16(),
				priority: reader.readUint8(),
				//data: reader.readBytes( item.descr_size - reader.getMovement() )
			};
		
			data.config = readESDiscriptor();
			data.config.object_type_id = reader.readUint8();
			data.config.object_type = objectTypes[data.config.object_type_id];
			
			var nbits = binUtil.byteToBits( reader.readByte() ); 
			data.config.stream_type = nbits.slice(0,6);
			data.config.upstream = nbits.slice(6,7);
			data.config.reserved = nbits.slice(7,8);
			
			data.buffer = reader.readUint(24);
			data.max_bitrate = reader.readUint32();
			data.avg_bitrate = reader.readUint32();
			
			return data;
		},
		stsd: function( reader, atom ){
			
			var data = {};
			data.version = reader.readInt8();
			data.flags = reader.readString(3);
			data.entries = reader.readUint32();
			//Following Sample Descriptions
			data.samples = [];
			var entry = 0;

			while( entry < data.entries ){
				entry++;
				var item = {};
				reader.trackMovement();
				item = SampleEntry( reader );
				if(audioTypeCodes[item.id]){
					item.type = 'audio';
				}else{
					item.type = codecTypeCodes[item.id] ? 'video' : null; 
				}
				item.version = reader.readInt16();
				item.revision = reader.readInt16();
				item.vendor = reader.readString(4);
				
				if(item.type == 'audio'){
					
					item.codec = audioTypeCodes[item.id];
					item.channels = reader.readInt16();
					item.sampleSize = reader.readInt16();
					item.compressionID = reader.readInt16();
					item.packetSize = reader.readInt16();
					item.sampleRate = Number( reader.readUint16()+'.'+reader.readUint16() );
					item.uncompressedBitrate = (item.sampleRate * item.sampleSize) * item.channels;
					item.out = [];
					var str;
					while(reader.bytesLeft() > 0 && str != 'esds'){
						str = reader.readString(4);
						item.out.push( str );
					}
					if(str == 'esds'){
						reader.seek(-8);
					}

					var attr = readBox( reader );
					item.attr = attr;
					
					if( attr.size > 0 ){
						if( attr.id == 'esds' ){
							var esds = exports.readers.esds( reader );
							item.esds = esds;
						}
					}
					
					item.data = reader.readString(  );

					
				}else if(item.type == 'video'){
					
					item.codec = codecTypeCodes[item.id];
					item.temporal = reader.readInt32();
					item.spatial = reader.readInt32();
					item.width = reader.readInt16();
					item.height = reader.readInt16();
					item.hres = readValue( 'FIXED:4', reader );
					item.vres = readValue( 'FIXED:4', reader );
					var dsize = reader.readInt32();
					item.frames = reader.readUint16();
					item.compressor = reader.readString(32);
					item.depth = reader.readInt16();
					item.color_table_id = reader.readInt16();
					item.params = {};
					
					//while(reader.bytesLeft() > 24){
						
						reader.trackMovement();
						
						var attr = readBox( reader );
						attr.bytesLeft = reader.bytesLeft();
						console.log(attr);
						
						switch(attr.id){
							case 'avcC':
								var avcProfiles = {
									66: 'Baseline',
									88: 'Extended',
									77: 'Main',
									100: 'High',
									110: 'High 10',
									122: 'High 4:2:2',
									244: 'High 4:4:4'
								};
								item.params[attr.id] = {};
								item.params[attr.id].version = reader.readUint8();
								item.params[attr.id].profile = reader.readUint8();
								item.params[attr.id].profile_name = avcProfiles[item.params[attr.id].profile];
								
								item.params[attr.id].profile_compatibility = reader.readUint8();
								item.params[attr.id].level = reader.readUint8().toString().split('').join('.');
								
								
								var nbits = reader.readBits(8);
								read_bits(nbits, 6);
								
								item.params[attr.id].lengthSizeMinusOne = read_bits(nbits, 2);
								item.params[attr.id].NALUnitLengthBytes = BYTES_IN_NAL_UNIT = item.params[attr.id].lengthSizeMinusOne+1;
								
								
								nbits = reader.readBits(8);
								console.log(nbits);
								//Number of Params inSet
								read_bits(nbits, 3);
								item.params[attr.id].params_set_count = read_bits(nbits, 5);
								item.params[attr.id].seqParams = {};
								
								console.log('params_set',item.params[attr.id].params_set_count);
								for (i=0; i < item.params[attr.id].params_set_count; i++){
								 	item.params[attr.id].nal_units = read_nal_unit( reader );
								 	
								 	/*
								 	
								 	//Reserved 3Bit
								 	
								 	bits = reader.readBits(8)[0].split('');
								 	console.log(bits);
								 	
								 
								 	var zcount  = 8-bits.length;
								 	console.log(zcount);
								 	seqParams.seq_param_set_id = zcount;
								 	
								 	
								 	if( [100,110,122,244,44,83,86,118].indexOf(seqParams.profile_idc) !== -1){
								 		
								 	}
								 	
								 	seqParams.bytes = reader.readBytes( len - 5 );
								 	item.params[attr.id].seqParams = seqParams;
								 	*/
								 	/*
								 	
								 	
								 	bits = reader.readBits(8)[0].split('');
								 	
								 	item.params[attr.id].seqParams.constraint_flag_0 = bits.shift();
								 	item.params[attr.id].seqParams.constraint_flag_1 = bits.shift();
								 	item.params[attr.id].seqParams.constraint_flag_2 = bits.shift();
								 	
								 	console.log( 'level_idc', reader.readUint8());
								 	
								 	bits = reader.readBits(8)[0].split('');
								 	console.log(bits);
								 	
								 	*/
								 	//item.params[attr.id].seqParams.push({ len: len, data: binUtil.toArray(reader.readBytes(len-2)).map( binUtil.map.toBits ) });
								}
								/*
							 	var pic_params = reader.readUint8();
							 	console.log('pic_params', pic_params, attr.size-reader.getMovement());
							 	
							 	item.params[attr.id].pic_params_count = pic_params;
							 	item.params[attr.id].picParams = {};
							
								for (i=0; i < pic_params; i++) {
								 	var len = reader.readUint16();
								 	item.params[attr.id].picParams.bytes = reader.readBytes( len );

								}
								console.log('Bytes Left', reader.bytesLeft());
								//item.params[attr.id].data = reader.readString( attr.size-reader.getMovement() );
								*/
							break;
							default:
								item.params[attr.id] = reader.readString( attr.size-8 );

						}
					//}
										
					//item.data = reader.readString(  );
				} 
				/*
				
					if( asize > 0 ){
						var atype = reader.readString(4);		
						if(atype == 'esds'){
							item[atype] = exports.readers.esds( reader );
						}
					}
				}else{
					
					
					//video descriptor
					
					item.depth = reader.readInt16();
					item.color_table_id = reader.readInt16();
					item.color_table = {};
					//console.log('DESC MOVEMENT',reader.getMovement());
					
					if(item.color_table_id == 0){
						item.color_table.size = reader.readInt32();
						item.color_table.type = reader.readString(4);
						if(item.color_table.type != 'ctab'){
							reader.seek(-8, 2);
						}else{
							item.color_table.seed = reader.readInt32();
							item.color_table.flags = reader.readInt16();
							item.color_table.tsize = reader.readInt16();
							item.color_table.colors = [];
							
							for(var i=0;i<=item.color_table.tsize;i++){
								item.color_table.colors.push([reader.readInt16(),reader.readInt16(),reader.readInt16(),reader.readInt16()]);
							}
						}
					}
					
					item.extentions = [];
					
					var extention = {};
					
					extention.size = reader.readInt32();
					extention.tag = reader.readString(4);
					
					//if(extention.tag == 'avcC'){
						/*
						 * aligned(8) class AVCDecoderConfigurationRecord {
							 unsigned int(8) configurationVersion = 1;
							 unsigned int(8) AVCProfileIndication;
							 unsigned int(8) profile_compatibility;
							 unsigned int(8) AVCLevelIndication;
							 bit(6) reserved = ‘111111’b;
							 unsigned int(2) lengthSizeMinusOne;
							 bit(3) reserved = ‘111’b;
							 unsigned int(5) numOfSequenceParameterSets;
							 for (i=0; i< numOfSequenceParameterSets; i++) {
							 unsigned int(16) sequenceParameterSetLength ;
							 bit(8*sequenceParameterSetLength) sequenceParameterSetNALUnit;
							 }
							 unsigned int(8) numOfPictureParameterSets;
							 for (i=0; i< numOfPictureParameterSets; i++) {
							 unsigned int(16) pictureParameterSetLength;
							 bit(8*pictureParameterSetLength) pictureParameterSetNALUnit;
							 }
							}

						 
						extention.version = reader.readByte();
						extention.profile = reader.readByte();
						extention.compatible = reader.readByte();
						extention.level = reader.readByte();
						
						var nbyte = binUtil.byteToBits( reader.readByte() ).slice(6).join('');
						console.log(nbyte, parseInt( nbyte, 2));
						extention.lengthSizeMinusOne = parseInt( nbyte, 2);
						nbyte = binUtil.byteToBits( reader.readByte() ).slice(3).join('');
						console.log(nbyte, parseInt( nbyte, 2));
						extention.params_set = parseInt( nbyte, 2);
						extention.params = [];
						for (i=0; i < extention.params_set; i++) {
						 	var len = reader.readUint16();
						 	extention.params.push(reader.readString(len));
						}
						extention.picParams = [];
						extention.pic_params_set = reader.readUint8()
						for (i=0; i < extention.pic_params_set; i++) {
						 	var len = reader.readUint16();
						 	extention.picParams.push(reader.readString(len));
						}
						//extention.buffer = reader.readUint32();
						//extention.max_bitrate = reader.readUint32();
						//extention.avg_bitrate = reader.readUint32();
						item.extentions.push( extention );
					//}
					
					item.data = reader.readString( item.descr_size - reader.getMovement() );

				}
				*/
				
				data.samples.push( item );
			//	console.log('TABLE FINISH ', reader.streamPosition, reader.length, data );
			}
			
			return data;
		},
		ctts: function(reader){
			var data = readExtendedBox( reader );
			data.count = reader.readUint32();
			data.entries = [];
			for (i=0; i < data.count; i++) {
				/*
				 * sample_count is an integer that counts the number of consecutive samples that have the given offset.
					sample_offset is a non-negative integer that gives the offset between CT and DT, such that CT(n) = 
				 */
				data.entries.push({ 
					sample_offset: reader.readUint32(), 
					sample_count: reader.readUint32()
				});
			 } 
			return data;
		},
		stts: function(reader){
			var data = {};
			data.version = reader.readByte();
			data.flags = reader.readBytes(3);
			data.entries = reader.readInt32();
			data.index = [];
			var totalEntrys = 0;
			for(var i=0;i<data.entries;i++){
				var entry = { sampleCount: reader.readInt32(), sampleSize: reader.readInt32() };
				totalEntrys += entry.sampleCount;
				data.index.push( entry );
			}
			data.totalEntrys = totalEntrys;
			return data;	
		},
		tkhd: function(reader){
			var data = {};
			data.version = reader.readString(1);
			data.flags = reader.readBytes(3);
			
			if(data.version == 1){
				data.creation_time = readDate( reader, 1 );
				data.modification_time = readDate( reader, 1 );
				data.track_id = reader.readUint32();
				data.reserved = reader.readUint32();
				data.duration = reader.readInt64();
			}else{
				data.creation_time = readDate( reader );
				data.modification_time = readDate( reader );
				data.track_id = reader.readInt32();
				data.reserved = reader.readInt32();
				data.duration = reader.readInt32();
			}
		
			data.reserved2 = reader.readString(8);
			data.layer = reader.readInt16();
			data.alt_group = reader.readInt16();
			if(data.alt_group == 0){
				data.track_type = 'video';
			}else if(data.alt_group == 1){
				data.track_type = 'audio';
			}else if(data.alt_group == 2){
				data.track_type = 'subtitle';
			}
			data.volume = Number( readValue( 'FIXED:2', reader ) );
			data.reserved3 = reader.readInt16();
			data.matrix = reader.readString(36);
			data.width = Number( readValue( 'FIXED:4', reader ) );
			data.height = Number( readValue( 'FIXED:4', reader ) );
			
			if(data.track_type == 'video' && data.width == 0 && data.height == 0){
				data.track_type = 'audio';
			}
			
			return data;
		},
		udta: function(reader){
			var data = {};
			while( reader.streamPosition < reader.length ){
				var item = {};
				reader.trackMovement();
				item.size = reader.readInt32();
				if(item.size > 0){ 
					item.name = reader.readString(4);
					item.data = reader.readString( item.size - reader.getMovement() );
					data[item.name] = item.data;
				}else{
					reader.streamPosition = reader.length;
				}
			}
			return data;
		},
		smhd: function(reader){
			var data = {};
			data.version = reader.readString(1);
			data.flags = reader.readString(3);
			data.balance = reader.readInt16();
			data.reserved = reader.readInt16();
			return data;
		},
		vmhd: function(reader){
			var data = {};
			data.version = reader.readString(1);
			data.flags = reader.readString(3);
			data.graphics_mode = reader.readInt16();
			data.op_color = [ reader.readInt16(), reader.readInt16(), reader.readInt16() ];
			return data;
		}
	};
	
	var readBox = function( reader ){
		var data = {};
		data.size = reader.readUint32();
		if( data.size == 1 ){
			reader.seek(-4);
			data.size = reader.readUint64();
		}else if( data.size == 'EOF' || data.size == 0 ){
			data.size = 'EOF';
		}
		data.id = reader.readString(4);
		if(data.id == 'uuid'){
			data.extended_id = reader.readBytes(16);
		}
		return data;
	};
	
	var readFullBox = function( reader ){
		var data = readBox( reader );
		data.version = reader.readUint8();
		data.flags = reader.readBits(24);
	};
	
	var readExtendedBox = function( reader ){
		var data = {};
		data.version = reader.readUint8();
		data.flags = reader.readBits(24);
		return data;
	};
	
	var readUint = function( reader, bitcount ){
		var sbytes = reader.readBytes( bitcount );
		var sbits = binUtil.toArray( sbytes ).map( binUtil.map.toBits );
		var bitstr = sbits.join(' ').split(' ').join('');
		return Number( parseInt( bitstr, 2 ) );
	};
	
	var readDate = function( reader, v ){
		if(!v) v = 0;
		var startDate = new Date(1904, 0, 1, 24, 0);
		var startTime = startDate.getTime();
		var timeSince =  v == 0 ? reader.readUint32() : reader.readUint64();
		var field_date = new Date( startTime + (timeSince*1000) );
		return field_date.toUTCString();
	};
	
	var readValue = function( value, reader ){
		if( utils.type( value, 'string' ) && value == ""+parseInt( value )+"" ){
			return reader.readString( parseInt( value ) );
		}else if( utils.type( value, 'number' ) && value <= 8 ){
			return reader['readUint'+(8*value)]();
		}else if( utils.type( value, 'string' )){
			if(value.indexOf(':') != -1){
				
				var type = value.split(':').shift();
				var val = parseInt( value.split(':').pop() );
				
				if(type == "EOF")
					return reader.readString();
				
							
				switch( type ){
					
					case 'FLOAT':
						return reader['readFloat'+(8*val)]();
					break;
					case 'TIME':
						return reader['readInt'+(8*val)]();
					break;
					case 'INT':
						return reader['readInt'+(8*val)]();
					break;
					case 'UINT':
						return reader['readUint'+(8*val)]();
					break;
					case 'FIXED':
						var hi =  reader['readInt'+(8*(val/2))]();
						var low =  reader['readInt'+(8*(val/2))]();
						return Number(hi+'.'+low).toFixed(2);
					break;
					case 'DATE':
						var startDate = new Date(1904, 0, 1, 24, 0);
						var startTime = startDate.getTime();
						var timeSince =  reader['readUint'+(8*val)]();
						var field_date = new Date( startTime + (timeSince*1000) );
						return field_date.toUTCString();
					break;
				}
			}
		}
	};
	
	function getAtomLength( reader ){
		var length = reader.readUint32();
		var hbytes = 4;
		if( length == 1 ){
			reader.seek(-4);
			length = reader.readUint64();
			hbytes = 8;
		}else if( length == 0 ){
			length = 'EOF';
		}
		return { size: length, hbytes: hbytes };
	}
	
	exports.identifyAtomAt = function( start, next ){
		
		var self = this;		
		var end = start+64;
		
		self._source.readAsBuffer( start, end, function( data ){
			
			var atom = {}, is_container = false;
			var reader = self.getReader( data, start );
			atom.startByte = reader.position();
			var atomHeader = getAtomLength( reader );
			
			atom.size = atomHeader.size;
			atom.id = reader.readString(4);
			atom.dataStart = reader.position();
			
			if( reader.bytesLeft() > 6 ){
				var trail = [];
				trail.push( reader.readUint16( ) );
				trail.push( reader.readUint16( ) );
				trail.push( reader.readString( 4 ) );
				var regex = new RegExp("([a-z]{4})");
				if(trail[0] == 0 && regex.test(trail[2]) ){
					is_container = true;
				}
			}
			
			if( atom.id == 'hdlr' ){
				is_container = false;
			}
			
			if( atom.id == 'meta' ){
				is_container = true;
				atom.dataStart += 4;
			}
			
			if(atom.size == 'EOF'){
				atom.endByte = self._source.size;
			}else{
				atom.endByte = atom.startByte + atom.size;
			}
			
			atom.type = is_container ? 'list' : 'data';

			next( atom );
			
		});
		
	};
	
	var getValue = function( root, path ){
		var paths = path.split('.'), curr = null;
		while( paths.length > 0 && root ){
			cur = paths.unshift();
			
			root = root[cur] ? root[cur] : null;
		}
		return root;
	};
	
	
	exports.parseComplete = function( atoms ){
		console.log('TRACK 0', atoms.moov['trak:0'] );
		console.log('TRACK 1', atoms.moov['trak:1'] );
		console.log('PARSE COMPLETE', atoms );
		var metadata = {};

		var timeScale = atoms.moov.mvhd.time_scale;
		
		metadata.binaryLanguage = 'Quicktime Format';
		
		metadata.major_brand = atoms.ftyp.major_brand;
		metadata.compatible = atoms.ftyp.compatible;
		metadata.created = atoms.moov.mvhd.creation_time;
		
	
		metadata.seconds = atoms.moov.mvhd.duration / timeScale;
		metadata.duration =  mediaUtil.secondsToTimecode(metadata.seconds);
		
		metadata.filesize = this._source.size;
		
		
		var trackId = 0;
		while(atoms.moov['trak:'+trackId]){
			
			var track = atoms.moov['trak:'+trackId];
			var trackInfo = track.mdia.minf;
			var sampleDescrs = trackInfo.stbl.stsd.samples;
			
			if( track.tkhd.track_type == 'video'){
				metadata.video = {};
				metadata.video.codec = '';
				for(var sampleFormat in sampleDescrs){
					metadata.video.codec += sampleDescrs[sampleFormat].codec;
				}
				metadata.video.seconds = metadata.seconds;
				metadata.video.height = track.tkhd.height;
				metadata.video.width = track.tkhd.width;
				metadata.video.frames = metadata.frames = trackInfo.stbl.stts.totalEntrys;
				metadata.video.fps = metadata.video.frames/metadata.video.seconds;
			
			}else if( track.tkhd.track_type == 'audio' ){
				
				metadata.audio = {};
				metadata.audio.channels = track.mdia.minf.stbl.stsd.samples[0].channels;
				metadata.audio.frequency = track.mdia.mdhd.time_scale+'Hz';
				metadata.audio.volume = track.tkhd.volume;
				metadata.audio.codec = track.mdia.minf.stbl.stsd.samples[0].codec;
				metadata.audio.language = track.mdia.mdhd.language;
				var bitrate;
				if(bitrate = getValue( track, 'mdia.minf.stbl.stsd.samples[0].esds.avg_bitrate' )){
					metadata.audio.bitrate = track.mdia.minf.stbl.stsd.samples[0].esds.avg_bitrate || null;
					
				}
				metadata.audio.bitrate = track.mdia.minf.stbl.stsd.samples[0].esds.avg_bitrate || null;
				metadata.audio.size = ( ( metadata.audio.bitrate ) * metadata.seconds ) / 8;
				
				if(metadata.audio.bitrate){
					metadata.audio.bitrate = Math.round( metadata.audio.bitrate / 1000 );
				}
				
			}else if( track.tkhd.track_type == 'subtitle' ){
				metadata.subtitles = {};
				metadata.subtitles.language = langTypeCodes[track.Language];
			}
			trackId++;
		}
		if(metadata.video){
			metadata.height = metadata.video.height;
			metadata.width = metadata.video.width;
		}
		
		if( !metadata.video.bitrate && metadata.audio.size ){
			var video_total = metadata.filesize - metadata.audio.size;
			metadata.video.size = video_total;
			
			metadata.video.bitrate = Math.round( ( ( video_total / metadata.seconds ) * 8 ) / 1000 );
			
		}
		
		/*
		metadata.title = ;
	
		metadata.writer = ;
		metadata.muxer = ;
		
		metadata.frameRate = '';
		metadata.frames = '';
		*/
		this.metadata = metadata;
		
	};
	
	return exports;
	
});