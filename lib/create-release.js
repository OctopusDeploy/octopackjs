'use strict';

var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('./request');
var projectsRepository;

module.exports = function(options, callback) {
	var verbose = options.verbose;
    options.channel = options.channel || 'Default';
    projectsRepository =  require('./repository/projects')(options);

	performPost();

	function performPost() {
        projectsRepository.byName(options.project).then(function(project) {
            return getChannels(options, project.Links.Channels);
        }).then(function(channels) {
            var channel;
            for (var i = 0; i < channels.length && !channel; i++) {
                if (channels[i].Name === options.channel) {
                    channel = channels[i];
                }
            }

            return channel ? channel : channels[0];
        }).then(function(channel) {
            var requestOptions = {
                url: request.getOctopusUrl(options.host) + '/releases',
                body: extractData({
                    projectId: channel.ProjectId,
                    channelId: channel.Id,
                    version: options.version,
                    selectedPackages: options.selectedPackages,
                }),
            };

            if (verbose) {
                console.info('Creating release: ' + requestOptions.url);
            }

            request.post(requestOptions, options, callback);
        }).catch(err => {
            callback(err, null);
        });
	}

    function extractData(data) {
        var extractedData = {
            Projectid: data.projectId,
            Version: data.version,
            SelectedPackages: data.selectedPackages
        };

        extractedData.ChannelId = data.channelId;

        return extractedData;
    }
};

function getChannels(options, channelUrl) {
    return new Promise(function(resolve, reject) {
        request.get({
            url: request.getOctopusUrl(options.host) + channelUrl.replace('api/', '')
        }, options, function(err, body) {
            if (err) {
                reject(err);
            }

            resolve(body.Items);
        });
    });
    
}
