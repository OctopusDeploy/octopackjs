'use strict';

var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('request');
var stream = require('stream');
var streamToBuffer = require('stream-to-buffer');


module.exports = function(file, options, callback) {
	var verbose = options.verbose;

	if(isReadableStream(file)) {
		streamToBuffer(file, function (err, buffer) {
			if(err){
				callback(err);
			} else {
				performPost(buffer);
			}
		});
	} else {
		performPost(file);
	}

	function performPost(fileBytes) {

		var requestOptions = {
			url: getUri(options),
			headers: {
				'X-Octopus-ApiKey': options.apikey || options.apiKey
			},
			formData: extractFormData(fileBytes, options),
			json: true
		};

		if (verbose) {
			console.info('Pushing to: ' + requestOptions.url);
		}

		request.post(requestOptions, function (err, resp, body) {
			if (err) {
				callback(err);
			} else {
				if (verbose) {
					console.info('Push response: ' + resp.statusCode +" - "+ resp.statusMessage);
				}
				if (resp.statusCode === 200 || resp.statusCode === 201) {
					callback(null, body);
				} else {
					callback({
						statusCode: resp.statusCode,
						statusMessage: resp.statusMessage,
						body: body,
						response: resp
					});
				}
			}
		});
	}

	function getUri(options) {
		var packageUri = options.host.replace(/\/?$/, '/');

		packageUri = url.resolve(packageUri, 'api/packages/raw');
		if (!!options.replace) {
			packageUri += '?replace=true';
		}
		return packageUri;
	}

	function extractFormData(file, options) {

		var fileContents;
        var fileName = options.name;
		if (typeof file === 'string') {
			fileContents = fs.createReadStream(file);
			fileName = fileName || file;
		} else if (Buffer.isBuffer(file) || isReadableStream(file)) {
			fileContents = file;
		}

        if (!fileName) {
            throw new Error('Filename is missing from options');
        }

		return {
			file: {
				value: fileContents,
				options: {
					filename: path.basename(fileName),
					contentType: 'application/octet-stream'
				}
			}
		};
	}

	function isReadableStream(obj) {
		return obj instanceof stream.Stream && typeof (obj._read) === 'function' && typeof (obj._readableState) === 'object';
	}
};