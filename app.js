var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mime = require('mime');

var multer  = require('multer');
var azure = require('azure');
//var mongodb = require('mongodb');

var ffmpeg = require('fluent-ffmpeg');
//var command = ffmpeg();


var fs = require('fs');

var helpme = require('./helpme.js');

var BLOBuser = 'upscaling';
var BLOBpass = 'QUHYFD6PQo0Ky5DWp2FLaDFKYbcEVMWDStaN4H+90GqK7rPFR8G0So0MG2KJNc/FQxvxl5M2BrU6Ty6XMEEDzw==';

var VIDEOCONTAINER = 'videofiles';

var blobClient = azure.createBlobService(BLOBuser, BLOBpass);

var BLOB_BASE_URL = 'https://upscaling.blob.core.windows.net/videofiles/';

//var MongoClient = mongodb.MongoClient;
//var mongoURL = 'mongodb://CAB432:CAB432@ds048878.mongolab.com:48878/scalingMongo';

/*

var blobID = file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2);

options = {
	BLOB_ID: blobID,
	videoname: name,
	originalname: oriname,
	originalfile: 'url',
	children: []
}

url, callback
*/
var NULLFUNC = function() {}

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './uploads')
	},
	filename: function (req, file, cb) {
		//console.log(file);
		//cb(null, file.fieldname + '-' + Date.now());
		var extension = '';
		var fname = file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2);
		if (fname) {
			extension = fname;
		} else {
			extension = mime.extension(file.mimetype);
		}
		var fullname = helpme.generatePseudoID(6) + "." + extension;
		cb(null, fullname);
	}
});

var allowedExt = ['mp4', 'webm', 'mkv'];

var upload = multer({
	dest: './uploads/',
	storage: storage,
	fileFilter: function(req, file, cb) {
		var ext = file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2);
		if (allowedExt.indexOf(ext) != -1) {
			cb(null, true);
		} else {
			cb(null, false);
		}
	}
});

var routes = require('./routes/index');
//var process = require('./routes/process');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
//app.use('/pro', users);

app.get('/upload', function(req, res){
	res.render('upload');
});

app.post('/upload', upload.single('video'), function (req, res) {
	// the file has been uploaded so do stuff
	
	// req.file is the 'video' file
	// req.body will hold the text fields, if there were any
	console.log(req.body); // form fields
    console.log(req.file); // form files
	
	var resolution = req.body.resolution;
	console.log(req.body.resolution);
	// video object
	var bID = req.file.filename.substr(0, req.file.filename.lastIndexOf('.'));
	var fname = req.file.filename;
	var n = req.file.originalname.substr(0, req.file.originalname.lastIndexOf('.'));
	var oname = req.file.originalname;
	var fsize = req.file.size;
	
	var vidObj = {
		blobID: bID,
		filename: fname,
		originalname: oname,
		name: n,//this is just the original name without ext.
		filesize: fsize,
		progress: 0,
		modifiers: null//, req.body
		//parent: null,//this is a root node
		//children: []
	};

	helpme.addNewVideo_DB(vidObj, NULLFUNC);
	
	var filepath = req.file.path;
	/*
			.inputOptions([
			'-sws_flags lanczos+full_chroma_inp',
			//'-c:v libx264',
			'-preset slow',
			'-crf 18',
			//'-b:a 128k',
			'-c:a libmp3lame',
			'-threads 0',
			'-pix_fmt yuv420p',
		])
	*/
	var command = ffmpeg(filepath)
		.size(resolution)
		.on('progress', debounce(function(info) {
				console.log('ping progress ' + Math.floor(info.percent) + '%');
				// Math.floor(info.percent) maybe?
				//helpme.updateVideo_DB({blobID: bID}, {progress: info.percent}, NULLFUNC);
			}, 1000)
		)
		.on('end', function() {
			console.log('done processing input stream');
			var newpath = './processed/' + fname;
			
			/*
			blobClient.createBlockBlobFromLocalFile(VIDEOCONTAINER, fname, newpath, function(error, result, response) {
				if (!error) {
					helpme.updateVideo_DB({blobID: bID}, {progress: 100}, NULLFUNC);
				} else console.log(error);
			});*/
		})
		.on('error', function(err) {
			console.log('an error happened: ' + err.message);
		})
		.save('./processed/' + fname);
	
	
	/*
	blobClient.createBlockBlobFromLocalFile(VIDEOCONTAINER, fname, filepath, function(error, result, response) {
		if (!error) {
			// file uploaded
			console.log("file uploaded");
			
			var vidObj = {
				blobID: bID,
				filename: fname,
				originalname: oname,
				name: n,//this is just the original name without ext.
				filesize: fsize,
				progress: 0,
				modifiers: null//,
				//parent: null,//this is a root node
				//children: []
			};
			
			helpme.addNewVideo_DB(vidObj, NULLFUNC);
			
			//
			var vidObj = {
				id: 'dude',
				filename: 'why',
				inddd: 100
			};
			helpme.addNewVideo_DB(vidObj, function() {
				helpme.updateVideo_DB({id:'dude'}, {filename:'when'}, function(nums) {
					helpme.getVideo_DB({id:'dude'}, function(res) {
						console.log(res);
					});
				});
			});
			//helpme.updateVideo_DB();
			///
			
		} else console.log(error);
	});*/
	
    res.status(204).end();
});

// this creates a delay between function calls so the progress doesn't hit the DB too much
function debounce(fn, delay) {
	var timer = null;
	return function () {
		var context = this, args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function () {
			fn.apply(context, args);
		}, delay);
	};
}

app.get('/Process/:id', function (req, res) {
	var bID = req.params.id;
	
	helpme.getVideo_DB({blobID: bID}, function(result) {
		if (result) {
			res.render('process', {
				title: result[0].name,
				link: BLOB_BASE_URL + result[0].filename
			});
			//console.log(result[0].name);
		}
	});
	
	/*
	blobClient.getBlobProperties(containerName, req.params.id, function (err, blobInfo) {
		if (err === null) {
			res.header('content-type', blobInfo.contentType);
			res.header('content-disposition', 'attachment; filename=' + blobInfo.metadata.filename);
			blobClient.getBlobToStream(containerName, req.params.id, res, function () { });
		} else {
			//helpers.renderError(res);
		}
	});
	*/
});

app.get('/download/:id', function (req, res) {
	var bID = req.params.id;
	
	helpme.getVideo_DB({blobID: bID}, function(result) {
		if (result) {
			blobClient.getBlobProperties(VIDEOCONTAINER, result[0].filename, function (err, blobInfo) {
				if (err === null) {
					//console.log(blobInfo);
					res.header('content-type', blobInfo.contentType);
					res.header('content-disposition', 'attachment; filename=' + result[0].originalname);
					blobClient.getBlobToStream(VIDEOCONTAINER, result[0].filename, res, function () { });
				} else {
					//helpers.renderError(res);
				}
			});
		}
	});
	
	/*
	blobClient.getBlobProperties(containerName, req.params.id, function (err, blobInfo) {
		if (err === null) {
			res.header('content-type', blobInfo.contentType);
			res.header('content-disposition', 'attachment; filename=' + blobInfo.metadata.filename);
			blobClient.getBlobToStream(containerName, req.params.id, res, function () { });
		} else {
			//helpers.renderError(res);
		}
	});
	*/
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
