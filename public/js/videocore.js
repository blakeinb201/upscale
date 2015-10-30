// document ready, init stuff here
$(function() {
	$("#uploadbutton").click(function(e) {
		e.preventDefault();
		var formData = {
			resolution: $('#resolution')[0].value
		};
		
		$('#uploadbutton').prop('disabled', true);
		
		console.log($('#resolution')[0].value);
		$("#progressNew").width("50%");
		
		$.ajax({
			url: '/process/' + window.video.blobID,  //Server script to process data
			type: 'POST',
			// Form data
			data: formData,
			success: function(data) {
				if (typeof data.redirect == 'string') {
					$("#progressNew").width("100%");
					window.location = data.redirect;
				}
			},
			xhr: function() {
				var xhr = new window.XMLHttpRequest();
				//Upload progress
				xhr.upload.addEventListener("progress", function(evt){
					if (evt.lengthComputable) {
						var percentComplete = Math.floor((evt.loaded / evt.total) * 100);
						//Do something with upload progress
						//console.log(percentComplete * 100);
						//$('#imagePercent').html(percentComplete + "%");
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
		});
	});
});

function initVideo(videoObject) {
	if (typeof videoObject.error === 'undefined') {
	var htmlData = '';
	
	window.video = videoObject;
	
	htmlData += "<div id='video-head'><div id='video-title'>" + videoObject.name + "</div>";
	if (videoObject.progress == 100) {
		htmlData += createDownloadLink(videoObject.blobID);
	}
	htmlData += "</div>";
	
	htmlData += '<div id="videoOrProgress">';
	if (videoObject.progress < 100) {
		htmlData += '<div id="progressbar"><div id="progress" style="width:' + videoObject.progress + '%"></div></div>';
		window.progressInt = setTimeout(function videotimeout() {
			console.log("post");
			$.ajax({
				url: '/update/' + videoObject.blobID,  //Server script to process data
				type: 'GET',
				// Form data
				//data: formData,
				success: function(data) {
					if (data) {
						console.log(data);
						$('#progress').width(data.progress + '%');
						if (data.progress == 100) {
							clearInterval(window.progressInt);
							$('#videoOrProgress').html('<div id="video"><video src="https://upscaling.blob.core.windows.net/videofiles/' + videoObject.filename + '" controls></video></div>');
							$('#video-form').show();
							$("#video-head").append(createDownloadLink(videoObject.blobID));
						} else {
							window.progressInt = setTimeout(videotimeout, 2000);
						}
					}
				}
			});
		}, 2000);
	} else {
		htmlData += '<div id="video"><video src="https://upscaling.blob.core.windows.net/videofiles/' + videoObject.filename + '" controls></video></div>';
		$('#video-form').show();
	}
	htmlData += '</div>';
	
	htmlData += "<div id='video-info'>";
	
	
	
	htmlData += createInfoNode('Blob ID', videoObject.blobID);
	htmlData += createInfoNode('File name', videoObject.filename);
	htmlData += createInfoNode('Original name', videoObject.originalname);
	htmlData += createInfoNode('Modifiers', createModifiersList(videoObject.modifiers));
	htmlData += createInfoNode('Parent', createBlobLink(videoObject.parent));
	htmlData += createInfoNode('Children', createChildNode(videoObject.children));
	
	htmlData += "</div>";
	
	$('#video-information').html(htmlData);
	}
};

function createInfoNode(vidName, vidValue) {
	return "<div class='video-info-item'><div class='video-info-title'>" + vidName + ": </div><div class='video-info-value'>" + vidValue + "</div></div>";
};

function createChildNode(child) {
	var childNode = "<ul id='children-list'>";
	for (x in child) {
		childNode += "<li>" + createBlobLink(child[x]) + "</li>";
	}
	childNode += "</ul>";
	return childNode;
}

function createModifiersList(modifiers) {
	var modNode = "<ul id='modifiers-list'>";
	for (x in modifiers) {
		modNode += "<li>" + x + ": " + modifiers[x] + "</li>";
	}
	modNode += "</ul>";
	return modNode;
}

function createBlobLink(bID) {
	if (bID != null) {
		return "<a href='/process/" + bID + "'>" + bID + "</a>";
	} else {
		return bID;
	}
}

function createDownloadLink(bID) {
	return "<a href='/download/" + bID + "' target='_blank'><img src='images/download.png'></a>";
}

/*
<div id='video-info'>
					<div class='video-info-item'>
						<div class='video-info-title'>Original name: </div>
						<div class='video-info-value'>1222222222222</div>
					</div>
				</div>	
{
    "blobID": "cH4grT",
    "filename": "cH4grT.webm",
    "originalname": "1428153469688.webm",
    "name": "1428153469688",
    "progress": 100,
    "modifiers": null,
    "parent": null,
    "children": [
        "8qM6n9"
    ]
}*/