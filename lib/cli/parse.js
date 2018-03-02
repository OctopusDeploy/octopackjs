'se strict';

var fs = require('fs');
var path = require('path');
var existsSync = fs.existsSync || path.existsSync;

module.exports = parse;

/**
 * Parses the command line arguments `process.argv` and returns the
 * octopack options
 *
 * @param  {Array} full process arguments, including `node` leading arg
 * @return {Object} { options, script, args }
 */
function parse(argv) {
    if (typeof argv === 'string') {
        argv = argv.split(' ');
    }

    var eat = function (i, args) {
        if (i <= args.length) {
            return args.splice(i + 1, 1).pop();
        }
    };

    var args = argv.slice(2);
    var nodemonOptions = { };
    var nodemonOpt = octopackOptions.bind(null, nodemonOptions);

    // move forward through the arguments
    for (var i = 0; i < args.length; i++) {
        if(i === args.length-1 && (args[i] === '.' || existsSync(args[i]))) {
            nodemonOptions.rootDir = args[i];
            break;
        }
        if (nodemonOpt(args[i], eat.bind(null, i, args)) !== false) {
            args.splice(i, 1);
            // cycle back one argument, as we just ate this one up
            i--;
        }
    }

    nodemonOptions.args = args;

    return nodemonOptions;
}


/**
 * Given an argument (ie. from process.argv), sets nodemon
 * options and can eat up the argument value
 *
 * @param {Object} options object that will be updated
 * @param {Sting} current argument from argv
 * @param {Function} the callback to eat up the next argument in argv
 * @return {Boolean} false if argument was not a nodemon arg
 */
function octopackOptions(options, arg, eatNext) {
    // line separation on purpose to help legibility
    if (arg === '--help' || arg === '-h' || arg === '-?') {
        var help = eatNext();
        options.help = help ? help : true;
    } else if (arg === '--version' || arg === '-v') {
        options.version = true;
    } else if (arg === '--outDir' || arg === '-O') {
        options.outDir = eatNext();
    } else

    if (arg === '--verbose' || arg === '-V') {
        options.verbose = true;
    } else

    if (arg === '--dependencies' || arg === '-D') {
        options.dependencies = eatNext();
    } else
    if (arg === '--format' || arg === '-F') {
        options.format = eatNext();
    } else

    if (arg === '--quiet' || arg === '-q') {
        options.quiet = true;
    } else

    if (arg === '--config' || arg === '--configFile') {
        options.configFile = eatNext();
    } else


    if (arg === '--package') {
        options.package = eatNext();
    } else

    if (arg === '--packageversion' || arg === '--packageVersion') {
        options.packageVersion = eatNext();
    } else

    if (arg === '--packageid' || arg === '--packageID'  || arg === '--packageId') {
        options.packageId = eatNext();
    } else

    if (arg === '--api-key' || arg === '--apiKey' || arg === '--apikey') {
        options.apikey = eatNext();
    } else

    if (arg === '--bypass-disk') {
        options.bypassDisk = true;
    } else

    if (arg === '--url') {
        options.url = eatNext();
    } else

    if (arg === '--replace') {
        options.replace = true;
    } else

    // if (arg === '--no-colours' || arg === '--no-colors') {
    //     options.colours = false;
    // } else {
    {
        console.error('Unknown argument `'+ arg +'`\nsee `octopack --help` for valid arguments');
        process.exit(1);
    }
}