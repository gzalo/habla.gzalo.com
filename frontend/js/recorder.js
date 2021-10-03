function Recorder(source) {
	var _this = this;
	
	var context = source.context;
	var bufferLen = 16384;
	
	this.recBuffer = [];
	this.recLength = 0;
	this.recording = false;
	this.targetSampleRate = 16000;
	this.sampleRate = context.sampleRate;
	
	this.record = function(){
		this.recording = true;
	}
	this.stop = function(){
		this.recording = false;
	}
	this.clear = function(){
		this.recLength = 0;
		
		for(i=0;i<this.recBuffer.length;i++){
			delete this.recBuffer[i];
		}
		
		this.recBuffer = [];
	}

	scriptNode = context.createScriptProcessor(bufferLen, 2, 2);

	scriptNode.onaudioprocess = function (e) {
		if (!_this.recording) return;

		inputBuffer = e.inputBuffer.getChannelData(0);
		
		_this.recBuffer.push(new Float32Array(inputBuffer));
		_this.recLength += inputBuffer.length;
	};
			
	source.connect(scriptNode);
	scriptNode.connect(context.destination); 
			
	this.exportWAV = function(cb) {
		var buf = mergeBuffers(this.recBuffer,this.recLength);
			
		var resampler = new Resampler(this.sampleRate, this.targetSampleRate, 1, buf);
		var resampled = resampler.resampler(this.recLength);
	
		//Normalizar
		var maximo = 0;
		for(i=0;i<resampler.outputBuffer.length;i++){
			maximo = Math.max(maximo, Math.abs(resampler.outputBuffer[i]));
		}
		for(i=0;i<resampler.outputBuffer.length;i++){
			resampler.outputBuffer[i] /= maximo;
		}
			
		var dataview = encodeWAV(resampler.outputBuffer);
		
		cb(new Blob([dataview]));
	}
	
	function floatTo16BitPCM(output, offset, input) {
		for (var i = 0; i < input.length; i++, offset += 2) {
			var s = Math.max(-1, Math.min(1, input[i]));
			output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
		}
	}

	function writeString(view, offset, string) {
		for (var i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
	
	function mergeBuffers(recBuffers, recLength) {
		var result = new Float32Array(recLength);
		var offset = 0;
		for (var i = 0; i < recBuffers.length; i++) {
			result.set(recBuffers[i], offset);
			offset += recBuffers[i].length;
		}
		return result;
	}

	function encodeWAV(samples){
		var buffer = new ArrayBuffer(44 + samples.length * 2);
		var view = new DataView(buffer);
		
		/* RIFF identifier */
		writeString(view, 0, 'RIFF');
		/* RIFF chunk length */
		view.setUint32(4, 36 + samples.length * 2, true);
		/* RIFF type */
		writeString(view, 8, 'WAVE');
		/* format chunk identifier */
		writeString(view, 12, 'fmt ');
		/* format chunk length */
		view.setUint32(16, 16, true);
		/* sample format (raw) */
		view.setUint16(20, 1, true);
		/* channel count */
		view.setUint16(22, 1, true);
		/* sample rate */
		view.setUint32(24, _this.targetSampleRate, true);
		/* byte rate (sample rate * block align) */
		view.setUint32(28, _this.targetSampleRate * 4, true);
		/* block align (channel count * bytes per sample) */
		view.setUint16(32, 1 * 2, true);
		/* bits per sample */
		view.setUint16(34, 16, true);
		/* data chunk identifier */
		writeString(view, 36, 'data');
		/* data chunk length */
		view.setUint32(40, samples.length * 2, true);

		floatTo16BitPCM(view, 44, samples);
		
		return view;
	}
}
