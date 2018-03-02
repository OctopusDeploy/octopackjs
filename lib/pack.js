'use strict';
var fs = require('fs');
var jsonfile = require('jsonfile');
var path = require('path');
var archiver = require('archiver');
var semver = require('semver');
var log = require('./log');
var stream = require('stream');
var isGlob = require('is-glob');


//archiver.registerFormat('nupkg', require('./nupkg'));


module.exports = function(config) {
    config = config || {};

    var pkgJson = getPackageJson();

    var archive = createArchiver(config.format);

    if(config.outDir) {
        var output = createOutput(config.outDir, getFileName(config.format));
        archive.pipe(output);
    }



    var methods = {};
    var isFinalized = false;

    methods.append = function append(name, file, options) {
        if(isFinalized) {
            throw new Error('Archive already finalized');
        }
        if (Buffer.isBuffer(file) || isReadableStream(file)) {
            name = name.replace(/\\/g, '/') + (!file ? '/' : '');
            options = options || {};
            archive.append(file, {name: name, date: options.date});
        } else {
            name = name.replace(/\\/g, '/');
            if (isGlob(name)) {
                archive.glob(name);
            } else{
                var content = typeof file === 'string' ? file : name;
                archive.file(content, {name: name.replace(/\\/g, '/')});
            }
        }
        return methods;
    };

    methods.finalize = function finalize(cb) {
        if(isFinalized) {
            throw new Error('Archive already finalized');
        }
        isFinalized = true;


        appendUserFiles(archive);
        appendPackageJson(archive, function () {
            if (config.dependencies !== 'none') {
                appendModules(archive, function () {
                    fin();
                });
            } else {
                log.verbose('Packaging dependencies skipped');
                fin();
            }
        });

        function fin() {
            var result = {stream: archive, name: getFileName(config.format)};
            if (config.outDir) {
                output.on('close', function () {
                    cb(null, result);
                });

                archive.finalize();
                result.path = path.resolve(config.outDir, result.name);



            } else {
                archive.finalize();
                cb(null, result);
            }
        }
    };

    return methods;

    function createOutput(dir, fileName) {
        fs.mkdir(dir, function () {});
        var fullPath = path.resolve(dir, fileName);
        var output = fs.createWriteStream(fullPath);
        output.on('close', function () {
            log.info('Created package ' + fullPath +' ('+ bytesToSize(output.bytesWritten) +')');
        });
        output.on('error', function (err) {
            throw err;
        });
        return output;
    }

    function appendUserFiles(archive) {
        log.verbose('Adding requested files to the archive');

        for (var i = 0; i < config.files.length; i++) {
            var file = config.files[i];
            archive.glob(file);
        }
    }

    function createArchiver(type) {
        var archive;
        switch (type) {
            case 'targz':
            case 'tar.gz':
                archive = archiver('tar', {gzip: true});
                break;
            case 'tar':
                archive = archiver('tar');
                break;
            case 'zip':
                archive = archiver('zip', { zlib: { level: 9 }});
                break;
            case 'nupkg':
            case 'nuget':
                throw new Error('Currently unable to support .nupkg file. Please use .tar.gz or .zip');
            //return archiver('nupkg', {nupkgOptions: details});
            default:
                throw new Error('Unknown archive type: '+ type);
        }

        archive.on('error', function (err) {
            throw err;
        });

        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                log.warn(err);
            } else {
                throw err;
            }
        });

        return archive;
    }

    function getFileName(type) {

        var version = config.packageVersion || pkgJson.version;
        if (!semver.valid(version)) {
            throw 'Version ' + version + ' is not a valid semver version';
        }
        var packageId = (config.packageId || pkgJson.name).replace('/', '.').replace('@', '');

        var extension;
        switch (type) {
            case 'targz':
            case 'tar.gz':
                extension = '.tar.gz';
                break;
            case 'tar':
                extension = '.tar';
                break;
            case 'zip':
                extension = '.zip';
                break;
            case 'nupkg':
            case 'nuget':
                throw new Error('Currently unable to support .nupkg file. Please use .tar.gz or .zip');
            default:
                throw new Error('Unknown archive type: '+ type);
        }

        return packageId +'.'+ version + extension;
    }

    function appendPackageJson(archive, cb) {
        addFile('package.json',
            function () {
                addFile('package-lock.json',
                    function () {
                        addFile('yarn.lock', cb);
                    });
            });

        function addFile(fileName, cb) {
            var filePath = path.resolve(config.rootDir, fileName);
            fs.stat(filePath, function (err) {
                if (!err) {
                    archive.file(filePath, {name: fileName});
                }
                cb();
            });
        }
    }

    function appendModules(archive, cb) {
        log.verbose('Adding '+ (config.dependencies === 'prod' ? 'non-dev' : 'all') +' dependencies to the archive');
        var cmd = 'npm ls --parseable '+ (config.dependencies === 'prod' ? ' --only prod' : '');

        require('child_process').exec(cmd, {cwd: config.rootDir}, function (err, stdout, stderr) {
            if (err) {
                log.warn(stderr);
            }

            var modules = stdout.split('\n').filter(function (mod) {
                return mod !== '' && mod !== config.rootDir;
            });
            if (modules) {
                modules.forEach(function addDirectory(modulePath) {
                    archive.directory(modulePath, path.relative(config.rootDir, modulePath));
                });
            }
            cb();
        });
    }

    function getPackageJson() {
        var pkgPath = path.resolve(config.rootDir, 'package.json');
        try {
            return jsonfile.readFileSync(pkgPath, {throws: true});
        }
        catch (e) {
            throw new Error('Unable to find package.json file at ' + pkgPath);
        }
    }
};

function isReadableStream(obj) {
    return obj instanceof stream.Stream && typeof (obj._read) === 'function' && typeof (obj._readableState) === 'object';
}


function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Byte';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (Math.round((bytes / Math.pow(1024, i)) * 100) / 100) + ' ' + sizes[i];
}