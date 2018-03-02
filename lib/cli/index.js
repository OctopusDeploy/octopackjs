'use strict';

var parse = require('./parse');

/**
 * Converts a string to command line args, in particular
 * groups together quoted values.
 * This is a utility function to allow calling nodemon as a required
 * library, but with the CLI args passed in (instead of an object).
 *
 * @param  {String} string
 * @return {Array}
 */
function stringToArgs(string) {
    var args = [];

    var parts = string.split(' ');
    var open = false;
    var grouped = '';
    var lead = '';

    for (var i = 0; i < parts.length; i++) {
        lead = parts[i].substring(0, 1);
        if (lead === '"' || lead === '\'') {
            open = lead;
            grouped = parts[i].substring(1);
        } else if (open && parts[i].slice(-1) === open) {
            open = false;
            grouped += ' ' + parts[i].slice(0, -1);
            args.push(grouped);
        } else if (open) {
            grouped += ' ' + parts[i];
        } else {
            args.push(parts[i]);
        }
    }

    return args;
}

module.exports = {
    parse: function (argv) {
        return parse(argv);
    },
};