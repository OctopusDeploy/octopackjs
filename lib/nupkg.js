'use strict';

var engine = require('zip-stream');
var util = require('archiver-utils');

var XMLWriter = require('xml-writer');
var path = require('path');
var propsId = '7857dbf80735479b8ee19fa60cb8239e';

// MIT licensed by Sindre Sorhus https://github.com/sindresorhus/semver-regex
var semVerRegex = /\bv?(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?\b/ig;

var Nupkg = module.exports = function(options) {
  if (!(this instanceof Nupkg)) {
    return new Nupkg(options);
  }

  options = this.options = util.defaults(options, {
    comment: '',
    forceUTC: false,
    store: false
  });

  if (typeof options.nupkgOptions !== 'object') {
    options.nupkgOptions = {};
  }

  this.supports = {
    directory: true
  };

  this.engine = new engine(options);

  this._appending = 0;
  this._extensions = [];
  this._meta = options.nupkgOptions;

  verifyMeta(this._meta);
};

Nupkg.prototype.append = function(source, data, callback) {
  var self = this;
  self._appending++;

  data.name = data.name
          .replace(/\\/g, '/')
          .replace(/\s/g,'%20');

  this.engine.entry(source, data, function() {
    self._extensions[path.extname(data.name).substr(1)] = true;
    if(--self._appending === 0 && self.idle){
      self.idle();
    }
    if(callback) {
      callback.apply(this, callback, arguments);
    }
  });
};

Nupkg.prototype.finalize = function() {
  var self = this;
  this.idle = function () {
    delete self.idle;
    self.append(getContentTypesXml(self._extensions), { name: '[Content_Types].xml' }, function () {
      self.append(getNuSpecXml(self._meta), { name: self._meta.id + '.nuspec' }, function () {
        self.append(getCorePropertiesXml(self._meta), { name: 'package/services/metadata/core-properties/' + propsId + '.psmdcp' }, function () {
          self.append(getRelsXml(self._meta), { name: '_rels/.rels' }, function () {
            self.engine.finalize();
          });
        });
      });
    });
  };

  if (self._appending === 0) {
    this.idle();
  }
};

Nupkg.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};

Nupkg.prototype.pipe = function() {
  return this.engine.pipe.apply(this.engine, arguments);
};

Nupkg.prototype.unpipe = function() {
  return this.engine.unpipe.apply(this.engine, arguments);
};

function getNuSpecXml(meta) {
  var properties = [
    'id', 'title', 'version', 'authors', 'owners', 'licenseUrl',
    'projectUrl', 'iconUrl', 'requireLicenseAcceptance',
    'description', 'summary', 'releaseNotes', 'copyright',
    'language', 'tags', 'dependencies'
  ];

  function normalizeVersionDep(version) {
    version = version.replace(/\s+/, '');

    if (!semVerRegex.test(version)) {
      throw new Error('Invalid version dependecy: ' + version);
    }

    if (semVerRegex.test(version)) {
      return version;
    }

    version = version[0] + version.substr(1, version.length - 2).split(',').join(', ') + version[version.length - 1];

    return version;
  }

  var xw = new XMLWriter(true);

  xw.startDocument();
  xw.startElement('package');
  xw.writeAttribute('xmlns', 'http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd');
  xw.startElement('metadata');

  properties.forEach(function (property) {
    if (property in meta) {
      if (property === 'dependencies') {
        xw.startElement('dependencies');

        meta[property].forEach(function (dep) {
          xw.startElement('dependency');
          xw.writeAttribute('id', dep.id);

          if (dep.version) {
            xw.writeAttribute('version', normalizeVersionDep(dep.version));
          }

          xw.endElement();
        });

        xw.endElement();
        return;
      }

      xw.writeElement(property, meta[property].toString());
    }
  });

  xw.endDocument();

  return xw.toString();
}

function getCorePropertiesXml(meta) {
  var xw = new XMLWriter(true, 'utf-8');

  function writeProp(name, value) {
    if (value) {
      xw.writeElement(name, value);
    }
  }

  xw.startDocument();
  xw.startElement('coreProperties');
  xw.writeAttribute('xmlns:dc', 'http://purl.org/dc/elements/1.1/');
  xw.writeAttribute('xmlns:dcterms', 'http://purl.org/dc/terms/');
  xw.writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
  xw.writeAttribute('xmlns', 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties');

  writeProp('dc:creator', meta.authors);
  writeProp('dc:description', meta.description);
  writeProp('dc:identifier', meta.id);
  writeProp('version', meta.version);
  writeProp('dc:language', meta.language);
  writeProp('keywords', meta.tags);
  writeProp('lastModifiedBy', 'NuGet, Version=2.8.50320.36, Culture=neutral, PublicKeyToken=null;Microsoft Windows NT 6.2.9200.0;.NET Framework 4');

  xw.endDocument();

  return xw.toString();
}

function getContentTypesXml(extensions) {
  var xw = new XMLWriter(true, 'utf-8');
  xw.startDocument();
  xw.startElement('Types');
  xw.writeAttribute('xmlns', 'http://schemas.openxmlformats.org/package/2006/content-types');

  addContentType('rels', 'application/vnd.openxmlformats-package.relationships+xml');
  addContentType('nuspec', 'application/octet');
  addContentType('psmdcp',  'application/vnd.openxmlformats-package.core-properties+xml');

  for (var ext in extensions)  {
    if(ext && ext !== '') {
      addContentType(ext, 'application/octet');
    }
  }

  function addContentType(ext, type){
    xw.startElement('Default');
    xw.writeAttribute('Extension', ext);
    xw.writeAttribute('ContentType', type || 'application/octet');
    xw.endElement();
  }

  xw.endDocument();
  return xw.toString();
}

function getRelsXml(meta) {
  var xw = new XMLWriter(true, 'utf-8');

  xw.startDocument();
  xw.startElement('Relationships');
  xw.writeAttribute('xmlns', 'http://schemas.openxmlformats.org/package/2006/relationships');

  xw.startElement('Relationship');
  xw.writeAttribute('Type', 'http://schemas.microsoft.com/packaging/2010/07/manifest');
  xw.writeAttribute('Target', '/' + meta.id + '.nuspec');
  xw.writeAttribute('Id', 'R569c48f3cf1b4b14');
  xw.endElement();

  xw.startElement('Relationship');
  xw.writeAttribute('Type', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties');
  xw.writeAttribute('Target', '/package/services/metadata/core-properties/' + propsId + '.psmdcp');
  xw.writeAttribute('Id', 'R9e8f0077d5174f67');
  xw.endElement();

  xw.endDocument();

  return xw.toString();
}

function verifyMeta(meta) {
  if (!meta.id) {
    throw new Error('Missing required package id.');
  }

  if (!/^[a-z0-9\.\-]+$/i.test(meta.id)) {
    throw new Error('Package id isn\'t in a valid format.');
  }

  if (!meta.version) {
    throw new Error('Missing required package version.');
  }

  if (!semVerRegex.test(meta.version)) {
    throw new Error('Version isn\'t proper sem-ver "x.x.x".');
  }

  if (!meta.authors) {
    throw new Error('Missing required package authors.');
  }

  if (!meta.description) {
    throw new Error('Missing required package description.');
  }
}