define('media/parser/base', function(){
	
	var exports = this.exports;
	
	exports._source = null;
	exports.ENDIAN = 'little';
	exports.metadata = {};
	exports.header = {};
	exports.MAX_DATA_IMPORT = 1048576/2;
	exports.ignore = [];
	exports.atoms = [];
	var BinaryReader;
	
	var AtomBase = function( id, start, end  ){
		
	};
	
	function reduceAspect( aspect ){
		var step = 0, asp = 0.1;
		while(step < 200 && asp - Math.floor(asp) !== 0){
			step++;
			asp = aspect * step;
		}
		return asp+':'+step;
	}
	
	function parseMetadata( md ){
		md.filesize = exports._source.size;
		md.aspectRatio = (md.width/md.height);
		md.aspect = reduceAspect(md.aspectRatio);
		
		if(md.video && !md.video.bitrate){
			//md.video.bitrate = '@'+Math.floor((( md.filesize/md.seconds)*0.8)/100);
		}
		
		if(md.video && md.video.codec){
			
		}
		
		console.log(md);
		return md;
	}
	
	Object.defineProperty( exports, 'metadata', {
		set: function( mdata ){
			parseMetadata( mdata );
			this._metadata = mdata;
			this.emit('metadata', mdata);
		},
		get: function(){
			return this._metadata;
		}
	});
	
	exports.AtomBase = AtomBase;
	
	exports.source = function( src, callback ){
		var self = this;
		console.log('Setting Parser Src ');
		exports._source = src;
		exports.bytesTotal = src.size;
		require('binary/reader', function( binaryReader ){
			BinaryReader = binaryReader.BinaryReader;
			self.initialize( callback );
		});
	};
	
	exports.compileAtoms = function( ){
		
		var self = this;
		console.log('COMPILE ATOMS');
		var atomTmp = self.atoms.slice(0);
		var atomData = {}, parents = [];
		var pIndex = 0;
		parents.push( { idx: 0, start: -1, end: self._source.size+1, obj: atomData, _keycounts: {} } );
		
		while(atomTmp.length > 0){
			
			var atom = atomTmp.shift();

			var parent = parents[parents.length-1];
			while( atom.startByte >= parent.end ){
				//Pop to Parent Level
				parents.pop();
				parent = parents[parents.length-1];
			}
						
			var atomId = atom.id;
			if(self.ignore.indexOf(atomId) === -1){
				
			if( parent._keycounts[atomId] !== undefined ){
				
				parent._keycounts[atomId] = parent._keycounts[atomId] + 1;
				if( parent._keycounts[atomId] == 1 ){
					parent.obj[atomId+':0'] = parent.obj[atomId];
					delete parent.obj[atomId];
				}
			}else{
				parent._keycounts[atomId] = 0;
			}
			
			if(parent._keycounts[atomId] > 0){
				atomId += ':'+parent._keycounts[atomId];
			}
			
			parent.obj[atomId] = { _map_: atom };
			if(atom.value){
				parent.obj[atomId] = atom.value;
			}
			
			if(atom.data){
				
				if(Object.keys(atom.data).length == 1 && atom.data.value ){
					parent.obj[atomId] = atom.data.value;
				}
				
				for(var dataName in atom.data){
					parent.obj[atomId][dataName] = atom.data[dataName];
				}
			}
			
			if( atom.type == 'list' ){
				pIndex++;
				parents.push({ idx: pIndex, start: atom.startByte, end: atom.endByte, obj: parent.obj[atomId], _keycounts: {} });
			}
			}
		}
		
		if(self.parseComplete){
			self.parseComplete( atomData );
			self.emit('progress', 1 );
		}
	};
	
	exports.foundAtom = function( atom ){
		var self = this;
		
		if(atom.type == 'data' && atom.value ){
			
			exports.atoms.push( atom );
			
		}else if(atom.type == 'data' && self.readers[atom.id]){
			
			self._source.readAsBuffer( atom.dataStart, atom.endByte, function( data ){
				
				var reader = self.getReader( data, atom.dataStart );
				atom.data = self.readers[atom.id](reader, atom );
				exports.atoms.push( atom );
				
			});
			
		}else{
			exports.atoms.push( atom );
		}
		
		var progress = ( atom.startByte / self.dataLength );
		self.emit('progress', progress );
		
	};
	
	exports.findAtoms = function( start, end, callback ){
		
		var self = this;
		var parentAtoms = [{ id: 'root', startByte: start, dataStart: start, endByte: end }];
		var getParentScope = function(){
			return parentAtoms[parentAtoms.length-1];
		};
		
		var continueParse = function(){
			
			if(start >= self._source.size)
				return self.compileAtoms();
				
			if( start >= getParentScope().endByte ){
				console.log('POPPING PARENT', getParentScope().id, start );
				while( start >= getParentScope().endByte ){
					parentAtoms.pop();	
				}
			};
			
			self.identifyAtomAt( start, function( atom ){
				
				atom.path = parentAtoms.map(function(a){
					return a.id;
				}).join('.');

				
				if( atom.type == 'list' ){
					console.log('PUSHING PARENT', atom.id, start );
					parentAtoms.push( atom );
				}
				
				start = atom.type == 'list' ? atom.dataStart : atom.endByte;
				atom.parent = getParentScope();
				
				console.log(atom);
				self.foundAtom( atom );
				continueParse();
			});
			
		};
		
		continueParse();
	};
	
	exports.getReader = function( data, offset ){	
		return new BinaryReader( new Uint8Array( data ), offset );
	};
	
	exports.getDataBuffer = function( start, end, callback ){	
		var self = this;
		self._source.readAsBuffer( start, end, function( data ){
			callback( data );
		});
	};
	
	exports.initialize = function( callback ){
		var self = this;
		self.dataLength = self._source.size;
		self.findAtoms( 0, self.dataLength, function( data ){
			callback( data );
		});
		return false;
	};

	return exports;
	
}, { extend: 'events' } );