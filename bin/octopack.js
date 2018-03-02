#!/usr/bin/env node
'use strict';

var cli = require('../lib/cli');
var options = cli.parse(process.argv);

if (options.help) {
    console.log(require('../lib/cli/help')());
    process.exit(0);
}

var config = require('../lib/config')(options);

if((config.url && !config.apikey) || (!config.url && config.apikey)) {
    console.error('You have provided a the Octopus url but no api-key');
    process.exit(1);
}

if(config.bypassDisk && !config.url) {
    console.error('You have provided --bypass-disk but have not specified where to upload the package to.');
    process.exit(1);
}

var octopack = require('../');
var log = require('../lib/log');
if(config.url && config.apikey) {
    if (config.package) {
        log.verbose('Package path provided, pack step will be bypassed');
        octopack.push(config.package, config, pushCompleteHandler(config.package));
    } else {
        if(config.bypassDisk) {
            log.verbose('Writing to disk bypassed');
            config.outDir = null;
        } else{
            config.outDir = config.outDir || config.rootDir || process.cwd();
        }

        octopack.pack(config).finalize(function (err, res) {
            var input = (config.bypassDisk) ? res.stream : res.path;
            var name = res.name;
            log.info('Archive created, pushing to server');
            octopack.push(input, {name: name,
                host: config.url,
                apikey: config.apikey,
                replace: config.replace
            }, pushCompleteHandler(name));
        });
    }
} else {
    octopack.pack(config).finalize(function (err){
        if(err) {
            throw err;
        }
    });
}

function pushCompleteHandler(name) {

    return function(err) {
        if(err){
            log.error(err.statusMessage +' ('+err.statusCode +')');
            log.info(err.body);
        } else {
            log.info('Pushed package ' + name + ' to ' + config.url);
        }
    };
}