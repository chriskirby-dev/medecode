define('media/util', function MediaUtil(){
	
	var exports = this.exports;

	exports.secondsToTimecode = function( sec ){
		var sec_num = parseInt(sec, 10); // don't forget the second param
		var dec = sec - parseInt(sec);
	    var hours   = Math.floor(sec_num / 3600);
	    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	    var seconds = Number(sec - (hours * 3600) - (minutes * 60)).toFixed(3);
	
	    if (hours   < 10) {hours   = "0"+hours;}
	    if (minutes < 10) {minutes = "0"+minutes;}
	    if (seconds < 10) {seconds = "0"+seconds;}
	    var time    = hours+':'+minutes+':'+seconds;
	    return time;
	};
	
	return exports;

});