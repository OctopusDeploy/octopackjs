'use strict';

var archiver = require('archiver');
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var isGlob = require('is-glob');

archiver.registerFormat('nupkg', require('./nupkg'));

module.exports = function(type, options) {
  if(typeof type === 'object' && !options){
    options = type;
    type = null;
  }
  options = options || {};
  type = type || 'tar.gz';
  if(type[0] === '.'){
    type = type.substring(1);
  }

  var methods = {};
  var details = getPackageDetails(options || {});
  var archive = createArchiver(type, details);

  archive.on('error', function (err) {
    throw err;
  });

  methods.append = function append(name, file, options) {
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

  methods.appendSubDir = function appendSubDir(dir, toRoot) {
    if (typeof toRoot == 'undefined')
    {
      toRoot = false;
    }
    dir = dir.replace(/\\/g, '/');
    archive.directory(dir, !toRoot);
    return methods;
  };

  methods.toFile = function toFile(dir, cb) {
    if(typeof dir === 'function') {
      cb = dir;
      dir = __dirname;
    }
    var fileName = getFileName();

    fs.mkdir(dir, function(err) {
      if(err && err.code !== 'EEXIST') {
        cb(err);
      } else {
        var filePath = path.join(dir, fileName);
        var output = fs.createWriteStream(filePath);

        archive.pipe(output);
        archive.finalize();

        output.on('close', function () {
          cb(null, { size: archive.pointer(), name: fileName, path: filePath});
        });
      }
    });
  };

  methods.toStream = function toStream(cb) {
    archive.finalize();
    cb(null, { stream: archive, name: getFileName()});
  };

  function getFileName() {
    return details.id + '.' + details.version + getExtension(type);
  }

  return methods;
};

function isReadableStream(obj) {
  return obj instanceof stream.Stream && typeof (obj._read) === 'function' && typeof (obj._readableState) === 'object';
}

function createArchiver(type) {
  switch (type) {
    case 'targz':
    case 'tar.gz':
      return archiver('tar', {gzip: true});
    case 'tar':
      return archiver('tar');
    case 'zip':
      return archiver('zip');
    case 'nupkg':
    case 'nuget':
      throw 'Currently unable to support .nupkg file. Please use .tar.gz or .zip';
      //return archiver('nupkg', {nupkgOptions: details});
  }
  throw 'Unknown archive type';
}

function getExtension(type){
  switch (type) {
    case 'targz':
    case 'tar.gz':
      return '.tar.gz';
    case 'tar':
      return '.tar';
    case 'zip':
      return '.zip';
    case 'nupkg':
    case 'nuget':
      throw 'Currently unable to support .nupkg file. Please use .tar.gz or .zip';
      //return '.nupkg';
  }
  throw 'Unknown archive type';
}

function getPackageDetails(options){
  return {
    id: options.id || getPackageJson(options).name.replace('/', '.').replace('@',''),
    version: options.version || getPackageJson(options).version
  };
}

function getPackageJson(options) {
  return require(options.packagejson || path.join(process.cwd(), 'package.json'));
}