'use strict';

var request = require('request');
var url = require('url');
var extend = null;
var verbose = false;
var octopusUrl;

module.exports = function(options, callback) {
	verbose = !!options.verbose;
    nullCheck(options, 'host');
    
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
    nullCheck(projectName, 'projectName', true);
    if(verbose) { console.log('Getting project info for \'' + projectName + '\''); }
    
    var requestOptions = extend({url: url.resolve(octopusUrl, 'api/projects/' + projectName) });
    request.get(requestOptions, handleResponse.bind(this, callback));
}

function getEnvironment(environmentName, callback) {
    nullCheck(environmentName, 'environmentName', true);
    if(verbose) { console.log('Getting environement info for \'' + environmentName + '\''); }
    
    var requestOptions = extend({url: url.resolve(octopusUrl, 'api/Environments/all/') });
    request.get(requestOptions, handleResponse.bind(this, function(body){
        callback(body.filter(function(env){
            return env.Name === environmentName;
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

function nullCheck(root, property, rootIsProperty) {
    var prop = rootIsProperty ? root : root[property]; 
    if(typeof prop === 'undefined') { throw new Error('Option "'+property+'" is undefined'); }
}

// Object.assign polyfill from MDN
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
  Object.assign = function(target) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    target = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var source = arguments[index];
      if (source != null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
    }
    return target;
  };
}