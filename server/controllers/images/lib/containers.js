/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const images_ = __.require('lib', 'images');
const putImage = require('./put_image');

const containerPutImage = (container, fnName) => (function(fileData) {
  const { id, path } = fileData;

  return images_[fnName](path)
  .then(() => images_.getHashFilename(path))
  .then(filename => putImage(container, path, id, filename));
});

module.exports = {
  users: {
    putImage: containerPutImage('users', 'shrinkAndFormat')
  },

  entities: {
    putImage: containerPutImage('entities', 'removeExif')
  },

  // Placeholder to add 'remote' to the list of containers, when it's actually
  // used to fetch remote images
  remote: {},
  // Same but for emails and client assets
  assets: {}
};
