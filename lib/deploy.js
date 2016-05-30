'use strict';

var request = require('request');
var url = require('url');
var extend = null;
var verbose = false;
var octopusUrl;

module.exports = function(options, callback) {
	verbose = !!options.verbose;
    octopusUrl = options.host.replace(/\/?$/, '/');
    var apiHeader = { 'X-Octopus-ApiKey': options.apikey };
    
    // helper for request-options
    extend = Object.assign.bind(null, {}, { headers: apiHeader, json: true });
    
    getProject(options.projectName, function(project){
       getEnvironment(options.deployTo, function(environment){
           getRelease(options.releaseVersion, project, function(release){
                deploy({
                    ReleaseId: release.Id,
                    EnvironmentId: environment.Id
                }, callback);
            });
       });
    });
};

function getProject(projectName, callback) {
    if(!projectName) { throw new Error('Option "projectName" is undefined'); }
    if(verbose) { console.log('Getting project info for \'' + projectName + '\''); }
    
    var requestOptions = extend({url: url.resolve(octopusUrl, 'api/projects/' + projectName) });
    request.get(requestOptions, handleResponse.bind(this, callback));
}

function getEnvironment(deployTo, callback) {
    if(!deployTo) { throw new Error('Option "deployTo" is undefined'); }
    if(verbose) { console.log('Getting environement info for \'' + deployTo + '\''); }
    
    var requestOptions = extend({url: url.resolve(octopusUrl, 'api/Environments/all/') });
    request.get(requestOptions, handleResponse.bind(this, function(body){
        callback(body.filter(function(env){
            return env.Name === deployTo;
        })[0])
    }));
}

function getRelease(releaseVersion, project, callback) {
    var version = releaseVersion || 'latest';
    if(verbose) { console.log('Getting release for version \'' + releaseVersion + '\''); }
    
    var requestOptions = extend({url: url.resolve(octopusUrl, 'api/projects/' + project.Id + '/releases/') });
    request.get(requestOptions, handleResponse.bind(this, function(body){
        if(/latest/i.test(releaseVersion)) {
            callback(body.Items[0]);    
        } else {
            callback(body.Items.filter(function(item){ return item.Version === releaseVersion; })[0]);
        }
    }));
}

function deploy(deployOptions, callback){
    var formData = JSON.stringify(deployOptions, null, 4);
    var requestOptions = extend({
        url: url.resolve(octopusUrl, 'api/deployments'),
        form: formData,
        json: false
    });
    request.post(requestOptions, function(err, resp, body){
        if(err) {
            callback(err);
            return;
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
    });
}

function handleResponse(callback, err, resp, body){
    if(err) {
        throw err;
    }
    callback(body);
}