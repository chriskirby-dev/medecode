define('media/parser/codes/itunes', function(){
	
	var exports = this.exports;
	
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
	
	return iTunesCodes;
	
});