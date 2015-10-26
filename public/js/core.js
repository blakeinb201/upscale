// document ready, init stuff here
$(function() {
	$('#uploadbutton').prop('disabled', false);
	
	$("#uploadbutton").click(function() {
		var formData = new FormData($('form')[0]);
		$.ajax({
			url: '/upload',  //Server script to process data
			type: 'POST',
			// Form data
			data: formData,
			xhr: function() {
				var xhr = new window.XMLHttpRequest();
				//Upload progress
				xhr.upload.addEventListener("progress", function(evt){
					if (evt.lengthComputable) {
						var percentComplete = Math.floor((evt.loaded / evt.total) * 100);
						//Do something with upload progress
						//console.log(percentComplete * 100);
						$('#imagePercent').html(percentComplete + "%");
						
					}
				}, false);
				return xhr;
			},
			//Ajax events
			/*
			beforeSend: beforeSendHandler,
			success: completeHandler,
			error: errorHandler,*/
			//Options to tell jQuery not to process data or worry about content-type.
			cache: false,
			contentType: false,
			processData: false
		});
	});
});

function progressHandlingFunction(e){
	if(e.lengthComputable) {
		$('progress').attr({value:e.loaded, max:e.total});
	}
}