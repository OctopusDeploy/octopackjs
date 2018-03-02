'use strict';

var path = require('path')
var jsonfile = require('jsonfile');
var semver = require('semver');
var log = require('../lib/log');

module.exports = function(args) {
    args = args || {};

    var config = loadConfigFile(args);
    var format = args.format || config.format || 'tar.gz';
    var combinedConfig = {
        rootDir: args.rootDir || process.cwd(),

        quiet: args.quiet || config.quiet,
        verbose: args.verbose || config.verbose,
        bypassDisk: args.bypassDisk || config.bypassDisk,

        url: args.url || config.url || args.host,
        apikey: args.apikey,
        replace: args.replace || config.replace,
        name: args.name,
        package: args.package,

        format: format[0] === '.' ? format.substring(1) : format,
        outDir: args.outDir || config.outDir,
        files: config.files || [],
        packageVersion: validateVersion(args.packageVersion || config.packageVersion),
        packageId: args.packageId || config.packageId,
        dependencies: validateDependencies(args.dependencies || config.dependencies || 'prod')
    };
    log.logLevel(combinedConfig);
    return combinedConfig;
};

function loadConfigFile(args) {
    var rootDir = args.rootDir || process.cwd(); // or somewhere else
    var pkgPath = path.resolve(rootDir, 'octopack.json');

    if(args.configFile) {
        pkgPath = args.configFile;
    }

    try {
        return jsonfile.readFileSync(pkgPath, {throws: true});
    } catch (e) {
        if(!args.configFile) {
            return {};
        }
    }

    try {
        pkgPath = path.resolve(pkgPath, 'octopack.json');
        return jsonfile.readFileSync(pkgPath, {throws: true});
    } catch (e) {
        throw new Error('Unable to load config file at ' + args.configFile);
    }
}

function validateDependencies(deps) {
    switch (deps.toLowerCase()) {
        case 'production':
        case 'prod':
        case 'p':
            return 'prod';
        case 'none':
        case 'n':
            return 'none';
        case 'both':
        case 'all':
        case 'b':
            return 'both';
    }
    throw new Error('Unknown dependency value `' + deps + '`. Value values are `prod`, `both` or `none`. Default value is `prod`');
}

function validateVersion(version) {
    if (version && !semver.valid(version)) {
        throw 'Version ' + version + ' is not a valid semver version';
    }
    return version;
}