define('media/parser/codecs', function(){
	
	var exports = this.exports;
	
	var codecCodes = {};
	
	var codecTypeCodes = {
		'cvid': 'Cinepak',
		'jpeg': 'JPEG',
		'smc ': 'Graphics',
		'rle ': 'Animation',
		'rpza': 'Apple video',
		'kpcd': 'Kodak Photo CD',
		'png ': 'Portable Network Graphics',
		'mjpa': 'Motion-JPEG A',
		'mjpb': 'Motion-JPEG B',
		'SVQ1': 'Sorenson Video v1',
		'SVQ3': 'Sorenson Video v3',
		'mp4v': 'MPEG-4 Video',
		'avc1': 'H.264 Video',
		'dvc ': 'NTSC Video',
		'dvcp': 'PAL Video',
		'gif ': 'CompuServe Graphics',
		'h263': 'H.263 Video',
		'h264': 'H.264 Video',
		'h265': 'H.265 Video',
		'tiff': 'Tagged Image File Format',
		'raw ': 'Uncompressed RGB',
		'dvca': "DV Audio",
		'qdmc': "QDesign music",
		'qdm2': "QDesign music v2",
		'qclp': "QUALCOMM PureVoice",
		'mp3': "MP3",
		'mp4a': "Advanced Audio Coding (AAC)",
		'ac3': "Digital Audio Compression Standard AC-3",
	};
	
	return codecCodes;
	
});