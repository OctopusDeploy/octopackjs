
var request = require('../request');

module.exports = function(options) {
    return {
        byName: function(projectName) {
            return new Promise(function(resolve, reject) {
                getAllProjects(options).then(function(projects) {
                    var project;
                    for (var i = 0; i < projects.length && !project; i++) {
                        if (projects[i].Name === projectName) {
                            project = projects[i];
                        }
                    }

                    if (!project) {
                        reject(new Error('Project with name ' + projectName + ' could not be found'));
                    }

                    resolve(project);
                });
            });
        }
    };
}

function getAllProjects(options) {
    return new Promise(function(resolve, reject) {
        request.get({
            url: request.getOctopusUrl(options.host) + '/projects/all',
        }, options, function(err, data) {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
}