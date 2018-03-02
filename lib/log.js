'use strict';

var level = 'info';
module.exports = {
    verbose: function(line) {if(level === 'verbose') {console.log(line);}},
    info: function(line) {if(level !== 'quiet') { console.info(line); }},
    warn: function(line) {if(level !== 'quiet') { console.warn(line); }},
    error: function(line) {if(level !== 'quiet') { console.error(line); }},
    logLevel: function(config) {
        if(config.quiet) {
            level = 'quiet';
        } else if (config.verbose) {
            level = 'verbose';
        }
    }
};

