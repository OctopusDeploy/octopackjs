octopack
====
> A nodejs tool for packaging and pushing projects to an Octopus Deploy instance.

## Installation
Install with [npm](https://npmjs.org/package/gulp-octo)

```shell
    npm install @octopus/octo-pack --save-dev
```

## API

### var package = octo.pack(type, options)

#### type
Optional parameter to define the package type. Valid values are `targz`, `tar`, `zip` or `nupkg`. If not provided this defaults to `targz`.

#### options.packagejson
Path to the `package.json` containing project information used to provide required package metadata.

#### options.id
Defines the `Id` component of the created package. By default it will extract the name out of `package.json` if present.

#### options.version
Defines the `version` component of the created package. By default it will extract the version out of `package.json` if present.

#### package.append(filePath, buff, options)
Adds the `buff` Buffer instance to the package named using the provided `filePath` parameter as a relative path from the root of the archive.

#### package.append(filePath, stream, options)
Adds the `stream` Stream instance to the package named using the provided `filePath` parameter as a relative path from the root of the archive.

#### package.append(filePath, file)
Adds the `file` from disk to the package named using the provided `filePath` parameter as a relative path from the root of the archive. If the `filePath` parameter is missing, the provided path to the file on disk will be used as the filePath in the archive.

#### package.toStream(function callback(err, data){})
Completes the packaging of the files and invokes the provided callback, returning an object containing the stream instance and name.

#### package.toFile(dir, function callback(err, data){})
Completes the packaging of the files, saves it to disk at the provided directory location and invokes the provided callback, returning an object containing the package path, name and size.

### octo.push(file, options, function callback(err, data){})

#### file
Package file that is to be pushed to server. This can be an instance of a Stream, Buffer or file path string.

#### options.host
Required property that points to the Octopus Server instance the package should be pushed to.

#### options.replace
Flag to force overwrite of existing package if one already exists with the same ID and version.

#### options.apiKey
Key linked to account with `BuiltInFeedPush` permissions. 
If `options.replace` is set to true and a package with the same ID and version already exists then the `BuiltInFeedAdminister` permission is required.

#### options.name
If a Stream or Buffer object is provided in the `file` parameter, the package name needs is required to properly store and use in Octopus Deploy. If this value is not provided and a path has been provided in the `file` parameter then the name of the file itself will be used.

#### callback
Invoked when the HTTP request has completed. The `data` object contains the HTTP response body that was returned as a result of a successful push.

## Usage Examples

#### Pack
```js
var octo = require('octo');
octo.pack()
  .append('buffer files/hello.txt', new Buffer('hello world'), {date: new Date(2011, 11, 11)})
  .append('stream.txt', fs.createReadStream('./package.json'))
  .append('lib/myfile.js')
  .toFile('./bin', function (filePath, data) {
    console.log("Package Saved: "+ data.name);
  });
``` 

#### Push
```js
var octo = require('octo');

octo.push('./bin/Sample.Web.3.2.1.tar.gz', {
        host: 'http://octopus-server/', 
        apiKey: 'API-XXXXXXXXX',
        replace: true
    }, function(err, result) {
     if(!err) {
        console.log("Package Pushed:" + body.Title + " v"+ body.Version +" (" + fileSizeString(body.PackageSizeBytes) +"nytes)"); 
     }
});
```

## Tests
```shell
    npm test
```

## License

(MIT License)

Copyright (c) 2015 Octopus Deploy support@octopus.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.