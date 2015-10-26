var exports = module.exports;

var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var mongoURL = 'mongodb://CAB432:CAB432@ds048878.mongolab.com:48878/scalingMongo';
var VIDEOCOLLECTION = 'videofiles';

exports.addNewVideo_DB = function(videoObject, calling) {
	MongoClient.connect(mongoURL, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			//HURRAY!! We are connected. :)
			//console.log('Connection established to', mongoURL);
			
			// Get the documents collection
			var collection = db.collection(VIDEOCOLLECTION);

			//Create some users
			//var video1 = {filename: 't.webm', waiting: 0, processing: 0, finished: 1, childs: []};
			//var user2 = {name: 'modulus user', age: 22, roles: ['user']};
			//var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

			// Insert some users
			collection.insert(videoObject, function (err, result) {
				db.close();
				calling(result);
			/*
			function (err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log('Inserted' + result.length + 'documents. The documents inserted with "_id" are:', result);
					callme();
				}
				*/
				//Close connection
				
			});
		}
	});
};



exports.updateVideo_DB = function(searchTerm, newVideoObject, calling) {
	// Get the documents collection
	MongoClient.connect(mongoURL, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			var collection = db.collection(VIDEOCOLLECTION);
			// update some users
			collection.update(searchTerm, {$set: newVideoObject}, function (err, numUpdated) {
				/*
				if (err) {
					console.log(err);
				} else if (numUpdated) {
					console.log('Updated Successfully' + numUpdated + 'document(s).');
				} else {
					console.log('No document found with defined "find" criteria!');
				}*/
				//Close connection
				db.close();
				calling(numUpdated);
			});
		}
	});
};

exports.getVideo_DB = function(searchTerm, calling) {
	// Use connect method to connect to the Server
	MongoClient.connect(mongoURL, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			//HURRAY!! We are connected. :)
			//console.log('Connection established to', mongoURL);

			// Get the documents collection
			var collection = db.collection(VIDEOCOLLECTION);

			// find some users
			collection.find(searchTerm).toArray(function (err, result) {
				/*
				if (err) {
					console.log(err);
				} else if (result) {
					console.log('Found:', result);
				} else {
					console.log('No document(s) found with defined "find" criteria!');
				}*/
				//Close connection
				db.close();
				calling(result);
			});
		}
	});
}

exports.generatePseudoID = function (len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
    return text;
}

