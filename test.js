'use strict';

var octo = require('./index');
var fs = require('fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('request');

describe('push', function() {
  var postStub;

  beforeEach(function(){
    postStub = sinon.stub(request, 'post');
  });

  afterEach(function(){
    postStub.restore();
  });

  it('should pass pkg stream', function() {
    octo.push(new Buffer('hello world'), {
      apikey: 'KEY',
      host: 'http://localhost',
      name: 'package.tar'
    });

    var req = postStub.firstCall.args[0];
    expect(req.headers['X-Octopus-ApiKey']).to.equal('KEY');
    expect(req.formData.file.value.toString()).to.equal(new Buffer('hello world').toString());
    expect(req.formData.file.options.filename).to.equal('package.tar');
  });

  describe('build url', function () {
    it('should include `replace` parameter if it is provided', function () {
      octo.push(new Buffer('hello world'), { replace: true, host: 'http://myweb/' });
      var req = postStub.firstCall.args[0];
      expect(req.url).to.equal('http://myweb/api/packages/raw?replace=true');
      postStub.reset();
    });

    it('should build correct url', function () {
      octo.push(new Buffer('hello world'), { host: 'http://myweb' });
      var req = postStub.firstCall.args[0];
      expect(req.url).to.equal('http://myweb/api/packages/raw');
    });

    it('should build correct url with port', function () {
      octo.push(new Buffer('hello world'), { host: 'http://myweb:3000' });
      var req = postStub.firstCall.args[0];
      expect(req.url).to.equal('http://myweb:3000/api/packages/raw');
    });

    it('should build correct url with relative path', function () {
      octo.push(new Buffer('hello world'), { host: 'http://myweb/path/to/octopus/' });
      var req = postStub.firstCall.args[0];
      expect(req.url).to.equal('http://myweb/path/to/octopus/api/packages/raw');
    });
  });

  it('should return response body if request successful', function(done) {
    var body = { prop: 12 };

    octo.push(new Buffer('hello world'), {
      apikey: 'KEY',
      replace: true,
      host: 'http://localhost'
    }, function(err, result) {
      expect(err).to.be.null;
      expect(result).to.eql(body);
      done();
    });

    var callback = postStub.firstCall.args[1];
    callback(null, {statusCode: 200}, body);
  });
});

describe('pack', function() {

  it('can create zip', function (done) {
    octo.pack()
      .append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
      .append('stream.txt', fs.createReadStream('./package.json'))
      .append('lib/pack.js')
      .toStream(function (err, data) {
        expect(err).to.be.null;
        expect(data.stream.readable).to.be.true;
        expect(data.name).not.to.be.null;
        done();
      });
  });

  it('can create nupkg', function (done) {
    octo.pack('nupkg')
      .append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
      .append('stream.txt', fs.createReadStream('./package.json'))
      .append('lib/pack.js')
      .toFile('./bin', function (err, data) {
        expect(err).to.be.null;
        expect(data.path).not.to.be.null;
        expect(data.name).not.to.be.null;
        done();
      });
  });
});
