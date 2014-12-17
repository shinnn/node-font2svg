'use strict';

var spawn = require('child_process').spawn;

var font2svg = require('../');
var fs = require('graceful-fs');
var noop = require('nop');
var rimraf = require('rimraf');
var test = require('tape');
var xml2js = require('xml2js');

var parseXML = xml2js.parseString;

var fontPath = 'test/SourceHanSansJP-Normal.otf';
var fontBuffer = fs.readFileSync(fontPath);
var pkg = require('../package.json');

rimraf.sync('test/tmp');

test('font2svg()', function(t) {
  t.plan(22);

  font2svg(fontBuffer, {include: 'Hello,☆世界★(^_^)b!'}, function(err, buf) {
    t.error(err, 'should create a font buffer when `include` option is a string.');
    parseXML(buf.toString(), function(err, result) {
      t.error(err, 'should create a valid SVG buffer.');

      var glyphs = result.svg.font[0].glyph;
      var unicodes = glyphs.map(function(glyph) {
        return glyph.$.unicode;
      });
      t.deepEqual(
        unicodes, [
          String.fromCharCode('57344'),
          '!', '(', ')', ',', 'H', '^', '_', 'b', 'e', 'l', 'o', '★', '☆', '世', '界'
        ], 'should create glyphs including private use area automatically.'
      );
      t.strictEqual(glyphs[0].$.d, undefined, 'should place `.notdef` at the first glyph');
    });
  });

  font2svg(fontBuffer, {
    include: ['\u0000', '\ufffe', '\uffff'],
    encoding: 'utf8'
  }, function(err, str) {
    t.error(err, 'should create a font buffer when `include` option is an array.');

    parseXML(str, function(err, result) {
      t.error(err, 'should create a valid SVG string when the encoding is utf8.');

      var glyphs = result.svg.font[0].glyph;
      t.equal(glyphs.length, 1, 'should ignore glyphs which are not included in CMap.');
    });
  });

  font2svg(fontBuffer, {encoding: 'base64'}, function(err, str) {
    t.error(err, 'should create a font buffer even if `include` option is not specified.');

    parseXML(new Buffer(str, 'base64').toString(), function(err, result) {
      t.error(err, 'should encode the result according to `encoding` option.');

      t.equal(
        result.svg.font[0].glyph.length, 1,
        'should create a SVG including at least one glyph.'
      );
    });
  });

  font2svg(fontBuffer, null, function(err) {
    t.error(err, 'should not throw errors even if `include` option is falsy value.');
  });

  font2svg(fontBuffer, {include: 1}, function(err) {
    t.error(err, 'should not throw errors even if `include` option is not an array or a string.');
  });

  font2svg(fontBuffer, {include: 'a', maxBuffer: 1}, function(err) {
    t.equal(err.message, 'stdout maxBuffer exceeded.', 'should pass an error of child_process.');
  });

  font2svg(fontBuffer, {
    include: 'foo',
    fontFaceAttr: {
      'font-weight': 'bold',
      'underline-position': '-100'
    }
  }, function(err, buf) {
    t.error(err, 'should accept `fontFaceAttr` option.');
    parseXML(buf.toString(), function(err, result) {
      t.error(err, 'should create a valid SVG buffer when `fontFaceAttr` option is enabled.');

      var fontFace = result.svg.font[0]['font-face'][0];

      t.equal(
        fontFace.$['font-weight'], 'bold',
        'should change the property of the `font-face` element, using `fontFaceAttr` option.'
      );

      t.equal(
        fontFace.$['underline-position'], '-100',
        'should change the property of the `font-face` element, using `fontFaceAttr` option.'
      );
    });
  });

  t.throws(
    font2svg.bind(null, new Buffer('foo'), noop), /out/,
    'should throw an error when the buffer doesn\'t represent a font.'
  );

  t.throws(
    font2svg.bind(null, 'foo', {include: 'a'}, noop), /is not a buffer/,
    'should throw an error when the first argument is not a buffer.'
  );

  t.throws(
    font2svg.bind(null, fontBuffer, {include: 'a'}, [noop]), /TypeError/,
    'should throw a type error when the last argument is not a function.'
  );

  t.throws(
    font2svg.bind(null, fontBuffer, {fontFaceAttr: 'bold'}, noop), /TypeError/,
    'should throw a type error when the `fontFaceAttr` is not an object.'
  );

  t.throws(
    font2svg.bind(null, fontBuffer, {
      fontFaceAttr: {foo: 'bar'}
    }, noop), /foo is not a valid attribute name/,
    'should throw an error when the `fontFaceAttr` has an invalid property..'
  );
});

test('"font2svg" command inside a TTY context', function(t) {
  t.plan(20);

  var cmd = function(args) {
    var tmpCp = spawn('node', [pkg.bin].concat(args), {
      stdio: [process.stdin, null, null]
    });
    tmpCp.stdout.setEncoding('utf8');
    tmpCp.stderr.setEncoding('utf8');
    return tmpCp;
  };

  cmd([fontPath])
    .stdout.on('data', function(data) {
      t.ok(/<\/svg>/.test(data), 'should print font data to stdout.');
    });

  cmd([fontPath, 'test/tmp/foo.svg']).on('close', function() {
    fs.exists('test/tmp/foo.svg', function(result) {
      t.ok(result, 'should create a font file.');
    });
  });

  cmd([fontPath, '--include', 'abc'])
    .stdout.on('data', function(data) {
      t.ok(/<\/svg>/.test(data), 'should accept --include flag.');
    });

  cmd([fontPath, '--in', '123'])
    .stdout.on('data', function(data) {
      t.ok(/<\/svg>/.test(data), 'should use --in flag as an alias of --include.');
    });

  cmd([fontPath, '-i', 'あ'])
    .stdout.on('data', function(data) {
      t.ok(/<\/svg>/.test(data), 'should use -i flag as an alias of --include.');
    });

  cmd([fontPath, '-g', '亜'])
    .stdout.on('data', function(data) {
      t.ok(/<\/svg>/.test(data), 'should use -g flag as an alias of --include.');
    });

  cmd([fontPath, '--font-weight', 'bold'])
    .stdout.on('data', function(data) {
      t.ok(
        /font-weight="bold"/.test(data),
        'should set the property of font-face element, using property name flag.'
      );
    });

  cmd(['--help'])
    .stdout.on('data', function(data) {
      t.ok(/Usage/.test(data), 'should print usage information with --help flag.');
    });

  cmd(['-h'])
    .stdout.on('data', function(data) {
      t.ok(/Usage/.test(data), 'should use -h flag as an alias of --help.');
    });

  cmd(['--version'])
    .stdout.on('data', function(data) {
      t.equal(data, pkg.version + '\n', 'should print version with --version flag.');
    });

  cmd(['-v'])
    .stdout.on('data', function(data) {
      t.equal(data, pkg.version + '\n', 'should use -v as an alias of --version.');
    });

  cmd([])
    .stdout.on('data', function(data) {
      t.ok(/Usage/.test(data), 'should print usage information when it takes no arguments.');
    });

  var unsupportedErr = '';
  cmd(['cli.js'])
    .on('close', function(code) {
      t.notEqual(code, 0, 'should fail when it cannot parse the input.');
      t.ok(
        /Unsupported/.test(unsupportedErr),
        'should print `Unsupported OpenType` error message to stderr.'
      );
    })
    .stderr.on('data', function(data) {
      unsupportedErr += data;
    });

  var invalidAttrErr = '';
  cmd([fontPath, '--font-eight', 'bold', '--font-smile'])
    .on('close', function(code) {
      t.notEqual(code, 0, 'should fail when it takes invalid flags.');
      t.ok(
        /font-eight is not a valid attribute name/.test(invalidAttrErr),
        'should print `invalid attribute` error message to stderr.'
      );
    })
    .stderr.on('data', function(data) {
      invalidAttrErr += data;
    });

  var enoentErr = '';
  cmd(['foo'])
    .on('close', function(code) {
      t.notEqual(code, 0, 'should fail when the file doesn\'t exist.');
      t.ok(/ENOENT/.test(enoentErr), 'should print ENOENT error message to stderr.');
    })
    .stderr.on('data', function(data) {
      enoentErr += data;
    });

  var eisdirErr = '';
  cmd([fontPath, 'node_modules'])
    .on('close', function(code) {
      t.notEqual(code, 0, 'should fail when a directory exists in the destination path.');
      t.ok(/EISDIR/.test(eisdirErr), 'should print EISDIR error message to stderr.');
    })
    .stderr.on('data', function(data) {
      eisdirErr += data;
    });
});

test('"font2svg" command outside a TTY context', function(t) {
  t.plan(4);

  var cmd = function(args) {
    var tmpCp = spawn('node', [pkg.bin].concat(args), {
      stdio: ['pipe', null, null]
    });
    tmpCp.stdout.setEncoding('utf8');
    tmpCp.stderr.setEncoding('utf8');
    return tmpCp;
  };

  var cp = cmd([]);
  cp.stdout.on('data', function(data) {
    t.ok(/<\/svg>/.test(data), 'should parse stdin and print SVG data.');
  });
  cp.stdin.end(fontBuffer);

  cmd(['test/tmp/bar.svg', '--include', 'ｱ'])
  .on('close', function() {
    fs.exists('test/tmp/bar.svg', function(result) {
      t.ok(result, 'should write a SVG file.');
    });
  })
  .stdin.end(fontBuffer);

  var err = '';
  var cpErr = cmd([]);
  cpErr.on('close', function(code) {
    t.notEqual(code, 0, 'should fail when stdin receives unsupported file buffer.');
    t.ok(
      /Unsupported/.test(err),
      'should print an error when stdin receives unsupported file buffer.'
    );
  });
  cpErr.stderr.on('data', function(output) {
    err += output;
  });
  cpErr.stdin.end(new Buffer('invalid data'));
});
