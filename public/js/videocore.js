// document ready, init stuff here
$(function() {

});

function initVideo(videoObject) {
	var htmlData = '';
	
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
	return "<a href='/process/" + bID + "'>" + bID + "</a>";
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