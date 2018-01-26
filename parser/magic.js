define('media/parser/magic', function(){
	
	var exports = this.exports;

	exports.mpeg = "00 00 01 Bx";
	exports.dvd = "00 00 01 BA";
	exports.iso = "66 74 79 70";
	exports.EBML = "1A 45 DF A3";
	exports.flv = "46 4C 56 01";
	exports.swf = "46 57 53";
	exports.mp3 = "49 44 33";
	exports.riff = "41 56 49 20 4C 49 53 54";
	exports.wav = "57 41 56 45 66 6D 74 20";
	exports.asf = "30 26 B2 75 8E 66 CF 11 A6 D9 00 AA 00 62 CE 6C";
	
	return exports;
	
});