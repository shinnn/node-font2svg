#!/usr/bin/env node
'use strict';

var fs = require('fs-extra');

var fontFaceAttrNames = [];

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    i: 'include',
    'in': 'include',
    g: 'include',
    h: 'help',
    v: 'version'
  },
  string: ['_', 'include'],
  boolean: ['help', 'version'],
  unknown: function(flag) {
    fontFaceAttrNames.push(flag);
  }
});

var pkg = require('./package.json');

function help() {
  var chalk = require('chalk');

  console.log([
    chalk.cyan(pkg.name) + chalk.gray(' v' + pkg.version),
    pkg.description,
    '',
    'Usage1: ' + pkg.name + ' <src path> <dest path> --include <string>',
    'Usage2: ' + pkg.name + ' <src path>  --include <string> > <dest path>',
    'Usage3: cat <src path> | ' + pkg.name + ' <dest path> --include <string>',
    'Usage4: cat <src path> | ' + pkg.name + ' --include <string> > <dest path>',
    '',
    'Options:',
    chalk.yellow('--include, -in, -i -g <string>') + '  Specify the characters to be included',
    chalk.yellow('--(attribute name)    <string>') + '  Set attribute of font-face element',
    '                                ' +
    chalk.gray('Example: --font-weight bold --units-per-em 980'),
    '',
    chalk.yellow('--help,         -h            ') + '  Print usage information',
    chalk.yellow('--version,      -v            ') + '  Print version',
    ''
  ].join('\n'));
}

function run(srcBuf, destPath) {
  var arrayDiff = require('array-difference');
  var font2svg = require('./');

  var fontFaceAttr = arrayDiff(argv._, fontFaceAttrNames).map(function(flagName) {
    return flagName.replace(/^--?/, '');
  }).reduce(function(result, attrName) {
    result[attrName] = argv[attrName];
    return result;
  }, {});

  var options = {
    include: argv.include,
    fontFaceAttr: fontFaceAttr
  };

  font2svg(srcBuf, options, function(err, buf) {
    if (err) {
      throw err;
    }

    if (destPath) {
      fs.outputFileSync(destPath, buf);
      return;
    }

    process.stdout.write(buf);
  });
}

if (argv.version) {
  console.log(pkg.version);
} else if (argv.help) {
  help();
} else if (process.stdin.isTTY) {
  if (argv._.length === 0) {
    help();
  } else {
    run(fs.readFileSync(argv._[0]), argv._[1]);
  }
} else {
  require('get-stdin').buffer(function(buf) {
    run(buf, argv._[0]);
  });
}
