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

var storageUser = 'upscaling';
var storagePass = 'QUHYFD6PQo0Ky5DWp2FLaDFKYbcEVMWDStaN4H+90GqK7rPFR8G0So0MG2KJNc/FQxvxl5M2BrU6Ty6XMEEDzw==';

var VIDEOCONTAINER = 'videofiles';
var blobClient = azure.createBlobService(storageUser, storagePass);
var BLOB_BASE_URL = 'https://upscaling.blob.core.windows.net/videofiles/';

var queueName = 'videoqueue';
var queueService = azure.createQueueService(storageUser, storagePass);
// https://upscaling.queue.core.windows.net/

// check the queue exists before beginning
queueService.createQueueIfNotExists(queueName, function(error) {
	if (error) {
		console.log(error);
	}
});

//var MongoClient = mongodb.MongoClient;
//var mongoURL = 'mongodb://CAB432:CAB432@ds048878.mongolab.com:48878/scalingMongo';


var NULLFUNC = function() {}


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
	
	var ext = req.file.filename.slice((req.file.filename.lastIndexOf(".") - 1 >>> 0) + 2);;
	
	// parent ID
	var bID = req.file.filename.substr(0, req.file.filename.lastIndexOf('.'));
	// parent filename (ID + ext)
	var fname = req.file.filename;
	// parent original name without ext
	var n = req.file.originalname.substr(0, req.file.originalname.lastIndexOf('.'));
	// parent original name + ext
	var oname = req.file.originalname;
	// parent filesize
	var fsize = req.file.size;
	
	var mbID = helpme.generatePseudoID(6);
	var mfname = mbID + '.' + ext;
	var mn = n;
	var moname = oname;
	
	var vidObj = {
		blobID: bID,
		filename: fname,
		originalname: oname,
		name: n,//this is just the original name without ext.
		//filesize: fsize,
		progress: 100,
		modifiers: null,//, req.body
		parent: null,//this is a root node
		children: [mbID]
	};
	
	var modifiedVideo = {
		blobID: mbID,
		filename: mfname,
		originalname: moname,
		name: mn,
		progress: 0,
		modifiers: req.body,
		parent: [bID],
		children: []
	};
	
	// original video object for future use.
	helpme.addNewVideo_DB(vidObj, NULLFUNC);
	
	// new object being processed/
	//helpme.addNewVideo_DB(modifiedVideo, NULLFUNC);
	helpme.addNewVideo_DB(modifiedVideo, function() {
		res.json({redirect: '/process/' + mbID});
	});
	
	var filepath = req.file.path;
	
	// the ffmpeg object to process the request
	var command = ffmpeg(filepath)
		.size(resolution)
		.on('progress', debounce(function(info) {
				console.log('[' + mbID + '] ' + Math.floor(info.percent) + '%');
				helpme.updateVideo_DB({blobID: mbID}, {progress: Math.floor(info.percent)}, NULLFUNC);
			}, 1000)
		)
		.on('end', function() {
			console.log('done processing [' + mbID + ']');
			var newpath = './processed/' + mfname;
			
			blobClient.createBlockBlobFromLocalFile(VIDEOCONTAINER, mfname, newpath, function(error, result, response) {
				if (!error) {
					helpme.updateVideo_DB({blobID: mbID}, {progress: 100}, NULLFUNC);
				} else console.log(error);
			});
		})
		.on('error', function(err) {
			console.log('an error happened: ' + err.message);
		})
		.save('./processed/' + mfname);

		
	// upload the original file
	
	blobClient.createBlockBlobFromLocalFile(VIDEOCONTAINER, fname, filepath, function(error, result, response) {
		if (!error) {
		} else console.log(error);
	});
	
    //res.status(204).end();
});

// view a file and select various options this will just display a loading bar is not finished
app.get('/process/:id', function (req, res) {
	/*
	blobID: result[0].blobID,// ID
	filename: result[0].filename,// filename (DI + ext)
	originalname: result[0].originalname,// originalname + ext
	name: result[0].name,// original name without ext
	modifiers: result[0].modifiers,// what was done to this
	parent: result[0].parent,// the parent that was modified to make this
	children: result[0].children//,// any children made from this file
	//link: BLOB_BASE_URL + result[0].filename
	*/
	var bID = req.params.id;
	helpme.getVideo_DB({blobID: bID}, function(result) {
		if (result) {
			res.render('process', {
				videoObject: result[0]
			});
			//console.log(result[0].name);
		}
	});
});

// start a new job of the specified video file
app.post('/process/:id', function (req, res) {
	console.log(req.body);
});

// this is for ajax posts to update the progress of a job
app.get('/update/:id', function (req, res) {
	var bID = req.params.id;
	helpme.getVideo_DB({blobID: bID}, function(result) {
		if (result && result[0].blobID == bID) {
			res.json({progress: result[0].progress});
		} else {
			res.json({error: "No ID found"});
		}
	});
});

// the user wants to download the file
app.get('/download/:id', function (req, res) {
	var bID = req.params.id;
	helpme.getVideo_DB({blobID: bID}, function(result) {
		if (result && result[0].progress == 100) {
			blobClient.getBlobProperties(VIDEOCONTAINER, result[0].filename, function (err, blobInfo) {
				if (err === null) {
					res.header('content-type', blobInfo.contentType);
					res.header('content-disposition', 'attachment; filename=' + result[0].originalname);
					blobClient.getBlobToStream(VIDEOCONTAINER, result[0].filename, res, function () { });
				} else {
					console.log(err);
					//helpers.renderError(res);
				}
			});
		}
	});
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// NOT IMPORTANT JUST IGNORE ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
