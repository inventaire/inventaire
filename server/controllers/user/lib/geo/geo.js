const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const db = __.require('level', 'geo')('geo');
const promises_ = __.require('lib', 'promises');

module.exports = function() {
  // Start following for changes
  let API;
  require('./follow')(db);

  return API =
    {search(latLng, kmRange){ return db.search(latLng, kmRange); }};
};
