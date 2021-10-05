const API_URL = "https://api-habla.gzalo.com/";

function __log(e, data) {
	$('#log').append(e + " " + (data || '') + "\n");
}

var audio_context;
var recorder;
var cronometro;
var decsegundos = 0;

function startUserMedia(stream) {
	var input = audio_context.createMediaStreamSource(stream);
	window.horrible_hack_for_mozilla = input;
	__log('Media stream created.');

	recorder = new Recorder(input);
	__log('Recorder initialised.');
}

function startRecording(button) {
	recorder && recorder.record();
	button.disabled = true;
	button.nextElementSibling.disabled = false;
	__log('Recording...');
	$('.tiempo').show();
	
	decsegundos = 0;
	cronometro = setInterval(function(){ actualizarCronometro() }, 10);
}

function actualizarCronometro(){
	var segs = decsegundos/100;
	$('.tiempo').html(segs.toFixed(2) + ' segundos');	
	decsegundos++;
}

function stopRecording(button) {
	recorder && recorder.stop();
	button.disabled = true;
	button.previousElementSibling.disabled = false;
	__log('Stopped recording.');
	clearInterval(cronometro);
	
	$("#grabmic .indicador").html('<img src="img/spinner.gif" alt="Subiendo..."/>');
	
	recorder.exportWAV(function(d){
		enviarWAV(d);
	});
}

function enviarWAV(blob) {
	fd = new FormData();
	fd.append('fname', 'testfile.wav');
	fd.append('data', blob);
	
	$.ajax({
		type: 'POST',
		url: API_URL,
		data: fd,
		processData: false,
		contentType: false
	}).done(function(data) {
		$("#grabmic .indicador").html('	');
		$("#grabmic").prepend('<div class="alert alert-success">'+data+'</div>').children(':first').hide().slideDown(500);		
		delete fd;
	});
	recorder.clear();		
}

window.onload = function init() {
	$('.tiempo').hide();
	var contextClass = (window.AudioContext || 
	window.webkitAudioContext || 
	window.mozAudioContext || 
	window.oAudioContext || 
	window.msAudioContext);

	if (contextClass) {
		// Web Audio API is available.
		audio_context = new contextClass();

		navigator.getUserMedia = ( navigator.getUserMedia ||
		   navigator.webkitGetUserMedia ||
		   navigator.mozGetUserMedia ||
		   navigator.msGetUserMedia);

		__log('Audio context set up.');
		__log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
		__log('Sample Rate: ' + audio_context.sampleRate);
	} else {
		__log('No web audio support in this browser!');
	}
	  
	  
	navigator.getUserMedia({audio:  {"mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
	"optional": []}}, startUserMedia, function(e) {
	  __log('No live audio input: ' + e + ' ' + e.name);
	});
};


$("form#subida").submit(function(){

    var formData = new FormData($(this)[0]);

	if( $( "#userfile" )[0].files.length == 0){
		return false; 
	}
	
	$("form#subida button").attr("disabled", true);
	$("#subidawav .indicador").html('<img src="img/spinner.gif" alt="Subiendo..."/>');

    $.ajax({
        url: API_URL,
        type: 'POST',
        data: formData,
        async: false,
		
        success: function (data) {			
			$("#subidawav").prepend('<div class="alert alert-success">'+data+'</div>').children(':first').hide().slideDown(500);
			$("#subidawav .indicador").html('');
			$("form#subida button").attr("disabled", false);
        },
        cache: false,
        contentType: false,
        processData: false
    });

    return false;
});
