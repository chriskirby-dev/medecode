
	var parseMetadata = function( metadata ){
		
		var data = {};
		if(metadata.format){
			data.duration = Number(metadata.format.duration);
			data.format = metadata.format.format_long_name;
			data.height = 0;
			data.width = 0;
			if(metadata.streams){
				data.video = [];
				data.audio = [];
				metadata.streams.forEach(function( stream ){
					var sdata = {};
					
					var codec_type = stream.codec_type;
					
					var copyProps = ['codec_type','codec_long_name','index','duration','width','height','bit_rate', 'time_base', 'profile', 'nb_frames', 'codec_name', 'bits_per_raw_sample'];
					
					sdata.codec = stream.bit_rate;
					if( codec_type == 'video' && stream.height ){
						sdata.height = stream.height;
						if( sdata.height > data.height ) data.height = sdata.height;
					}
					
					if( codec_type == 'video' && stream.width ){
						sdata.width = stream.width;
						if( sdata.width > data.width ) data.width = sdata.width;
					}
					
					sdata.bitrate = stream.bit_rate;
					sdata.codec_name = stream.codec_name;
					sdata.bits_per_raw_sample = stream.bits_per_raw_sample;
				
					data[codec_type].push(sdata);
					
				});
			}
			
			
			
		};
		
		console.log(data);
		return data;
	};
	
	
