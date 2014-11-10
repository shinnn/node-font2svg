# font2svg

[![Build Status](https://travis-ci.org/shinnn/node-font2svg.svg?branch=master)](https://travis-ci.org/shinnn/node-font2svg)
[![Build status](https://ci.appveyor.com/api/projects/status/15sny6ppx9ar788i?svg=true)](https://ci.appveyor.com/project/ShinnosukeWatanabe/node-font2svg)
[![Coverage Status](https://img.shields.io/coveralls/shinnn/node-font2svg.svg)](https://coveralls.io/r/shinnn/node-font2svg)
[![Dependency Status](https://david-dm.org/shinnn/node-font2svg.svg)](https://david-dm.org/shinnn/node-font2svg)
[![devDependency Status](https://david-dm.org/shinnn/node-font2svg/dev-status.svg)](https://david-dm.org/shinnn/node-font2svg#info=devDependencies)

Create a SVG subset font from a font file

```javascript
var fs = require('fs');
var font2svg = require('font2svg');

var buf = fs.readFileSync('path/to/font.otf');

font2svg(buf, {include: ['A', 'B', 'C', '0', '1', '2']}, function(err, result) {
  if (err) {
    throw err;
  }

  result.toString(); //=> '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<svg>\n  <font ... '
});
```

## Requirements

`tx` (a part of [Adobe Font Development Kit for OpenType](http://www.adobe.com/devnet/opentype/afdko.html)) is required.

After installation, run `tx -v` command to check if `tx` has been installed successfully.
 
## Installation

[![NPM version](https://badge.fury.io/js/font2svg.svg)](https://www.npmjs.org/package/font2svg)

[Use npm](https://www.npmjs.org/doc/cli/npm-install.html).

```sh
npm install font2svg
```

## API

```javascript
var font2svg = require('font2svg');
```

### font2svg(buffer[, options], callback)

#### buffer

Type: [`Buffer`][buffer] of a font file

Supported font formats depend on `tx`:

> Conversion of font data represented in the following
formats is supported: PFA, PFB, LWFN-POST, FFIL-sfnt, OTF, TTF, TTC, and
AppleSingle/Double-sfnt. sfnt-formatted fonts with header versions of the
following kinds are supported: 1.0, true, ttcf, typ1, CID, and OTTO. Note that
OCF is not supported by tx.

#### options

In addition to the following, all options for [child_process.exec][exec] except for `encoding` are available.

*Note that [`maxBuffer` option][exec] is `300000000` by default, unlike the original value (`200*1024`).*

##### options.include

Type: `String` or `Array` of `String`  
Default: `[]`

The characters to be included in the SVG font subset.

##### options.fontFaceAttr

Type: `Object`  
Default: `{}`

Set the attributes of `font-face` element.

```javascript
font2svg(fontBuffer, {
  fontFaceAttr: {
    'font-weight': 'bold',
    'underline-position': '-100'
  }
}, function(err, result) {
  result.toString(); //=> ... <font-face ... font-weight="bold" underline-position="-100"> ...
});
```

Every key of the object must be [a valid attribute name of `font-face` element](http://www.w3.org/TR/SVG/fonts.html#FontFaceElement).

```javascript
// It throws an error because `font-weeight` is not a valid name of `font-face` element.
font2svg(fontBuffer, {'font-weeight': 'bold'}, callback);
```

#### options.encoding

Type: `String`  
Default: `null`

Set encoding of the result ([`Buffer`][buffer] by default).

#### callback(*error*, *svgData*)

*error*: `Error`  
*svgData*: `Buffer` or `String` (accoding to [`options.encoding`](#optionsencoding))

```javascript
var buf = fs.readFileSync('path/to/font.ttf');

font2svg(buf, {
  include: ['Hello, world.'],
  encoding: 'utf-8'
}, function(err, result) {
  result; //=> <?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<svg>\n  <font ... '
});
```

## CLI

You can use this module as a CLI tool by installing it [globally](https://www.npmjs.org/doc/files/npm-folders.html#global-installation).

```sh
npm install -g font2svg
```

### Usage

```sh
Usage1: font2svg <src path> <dest path> --include <string>
Usage2: font2svg <src path>  --include <string> > <dest path>
Usage3: cat <src path> | font2svg <dest path> --include <string>
Usage4: cat <src path> | font2svg --include <string> > <dest path>

Options:
--include, -in, -i -g <string>  Specify the characters to be included
--(attribute name)    <string>  Set attribute of font-face element
                                Example: --font-weight bold --units-per-em 980

--help,         -h              Print usage information
--version,      -v              Print version
```

### Examples

```sh
font2svg src-font.otf dest-font.svg --include "foobar" --font-weight bold 
```

```sh
cat src-font.ttf | font2svg --include "bazqux" > dest-font.svg 
```

## License

Copyright (c) 2014 [Shinnosuke Watanabe](https://github.com/shinnn)

Licensed under [the MIT License](./LICENSE).

[buffer]: http://nodejs.org/api/buffer.html#buffer_buffer
[exec]: http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
