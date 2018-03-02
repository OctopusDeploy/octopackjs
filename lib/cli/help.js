"use strict";

var fs = require('fs');
var path = require('path');

module.exports = help;

function help() {
    try {
        var dir = path.join(__dirname, 'help.txt');
        var body = fs.readFileSync(dir, 'utf8');
        return body;
    } catch (e) {
        return 'help can\'t be found';
    }
}