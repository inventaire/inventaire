/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const images_ = __.require('lib', 'images');
// 'swift' or 'local'
const { mode } = CONFIG.mediaStorage;
_.info(`media storage: ${mode}`);
const client = require(`./${mode}_client`);

module.exports = (container, path, id, filename) => client.putImage(container, path, filename)
.then(_.Log('new image url'))
.then(url => ({
  id,
  url
}));
