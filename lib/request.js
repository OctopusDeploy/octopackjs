'use strict';

var request = require('request');
var url = require('url');

module.exports = {
	post: _post,
	get: _get,
    getOctopusUrl: _getOctopusUrl
};

function _get(requestOptions, options, callback) {
	var verbose = options.verbose || false;

    // populate requestOptions with apikey, ...
    setDefaultOptions(requestOptions, options);
    
    if (verbose) {
        console.info('Get: ' + requestOptions.url);
    }

    request.get(requestOptions, requestCallback(callback, verbose));
}

function _post(requestOptions, options, callback) {
	var verbose = options.verbose || false;

    // populate requestOptions with apikey, ...
    setDefaultOptions(requestOptions, options);
    
    if (verbose) {
        console.info('Post: ' + requestOptions.url);
    }

    request.post(requestOptions, requestCallback(callback, verbose));
}

function _getOctopusUrl(host) {
    var packageUri = host.replace(/\/?$/, '/')

    return url.resolve(packageUri, 'api');
}

function requestCallback(callback, verbose) {
    return function(err, resp, body) {
        if (err) {
            callback(err);
        } else {
            if (verbose) {
                console.info('Response: ' + resp.statusCode);
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
    }
}

/**
 * Populate the request options
 */
function setDefaultOptions(requestOptions, options) {
    // Object.assign is not available so we just put these variables on the object
    requestOptions.headers = requestOptions.headers || {};
    requestOptions.headers['X-Octopus-ApiKey'] = options.apikey;
    requestOptions.json = true;

    return requestOptions;
}