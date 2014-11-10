'use strict';

var Download = require('download');

var download = new Download({extract: true, mode: '777'})
  .get('http://download.macromedia.com/pub/developer/opentype/FDK-25-LINUX.zip')
  .dest(process.cwd());

download.run(function(err) {
  if (err) {
    throw err;
  }
});
