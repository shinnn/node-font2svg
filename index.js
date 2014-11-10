/*!
 * font2svg | MIT (c) Shinnosuke Watanabe
 * https://github.com/shinnn/node-font2svg
*/
'use strict';

var exec = require('child_process').exec;

var allFontFaceAttrs = require('all-font-face-attrs');
var codePoints = require('code-points');
var fontCmap = require('font-cmap');
var rimraf = require('rimraf');
var singleCodePoint = require('code-point');
var sortNumbers = require('sort-numbers');
var tempWrite = require('temp-write');
var xml2js = require('xml2js');

var parseXML = xml2js.parseString;
var xmlBuilder = new xml2js.Builder();

module.exports = function font2svg(fontBuf, options, cb) {
  if (cb === undefined) {
    cb = options;
    options = {};
  } else if (!options) {
    options = {};
  }

  if (typeof cb !== 'function') {
    throw new TypeError(cb + ' is not a function.');
  }

  options.fontFaceAttr = options.fontFaceAttr || {};

  if (typeof options.fontFaceAttr !== 'object') {
    throw new TypeError('fontFaceAttr option should be an object.');
  }

  Object.keys(options.fontFaceAttr).forEach(function(attrName) {
    if (allFontFaceAttrs.indexOf(attrName) === -1) {
      throw new Error(attrName + ' is not a valid attribute name of the font-face element.');
    }
  });

  options.maxBuffer = options.maxBuffer || 300000000;

  var cmap = fontCmap(fontBuf);

  var points;
  if (Array.isArray(options.include)) {
    points = options.include.map(function(char) {
      return singleCodePoint(char);
    });
  } else if (options.include === undefined) {
    points = [];
  } else {
    points = codePoints('' + options.include, {unique: true});
  }

  points = sortNumbers(points);

  if (points.indexOf(0) === -1) {
    points.unshift(0);
  }

  var includeIds = [];
  var uniquePoints = [];
  points.forEach(function(point) {
    if (cmap[point] !== undefined && includeIds.indexOf(cmap[point]) === -1) {
      includeIds.push(cmap[point]);
      uniquePoints.push(point);
    }
  });

  includeIds = sortNumbers(includeIds);

  tempWrite(fontBuf, '.svg', function(err, tmpPath) {
    if (err) {
      cb(err);
      return;
    }

    var command = 'tx -svg -sa -g ' + includeIds.join(',') + ' ' + tmpPath;

    var encoding = options.encoding;
    options.encoding = 'utf8';

    exec(command, options, function(err, stdout) {
      if (err) {
        cb(err);
        return;
      }

      rimraf(tmpPath, function(err) {
        if (err) {
          cb(err);
          return;
        }

        parseXML(stdout, function(err, result) {
          if (err) {
            cb(err);
            return;
          }

          var fontFace = result.svg.font[0]['font-face'][0];

          Object.keys(options.fontFaceAttr).forEach(function(attrName) {
            fontFace.$[attrName] = options.fontFaceAttr[attrName];
          });

          var glyphs = result.svg.font[0].glyph;

          for (var i = 1; i < glyphs.length; i++) {
            glyphs[i].$.unicode = '&#' + uniquePoints[i] + ';';
          }

          var svgString = xmlBuilder.buildObject(result).replace(/&amp;/g, '&');

          if (encoding) {
            if (encoding === 'utf8' || encoding === 'utf-8') {
              cb(null, svgString);
              return;
            }
            cb(null, new Buffer(svgString).toString(encoding));
            return;
          }

          cb(null, new Buffer(svgString));
        });
      });
    });
  });
};
