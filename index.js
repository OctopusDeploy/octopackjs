'use strict';
//var pack = require('./lib/pack2.js');
var configBuilder = require('./lib/config');
var log = require('./lib/log');

module.exports = {
    pack: function(config, cb) {
        config = configBuilder(config);
        log.logLevel(config);
        return require('./lib/pack.js')(config, cb);
    },
 	push: function(file, config, cb) {
        config = configBuilder(config);
        log.logLevel(config);
        return require('./lib/push.js')(file, config, cb);
    }
};
