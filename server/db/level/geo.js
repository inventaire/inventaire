/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const assert_ = __.require('utils', 'assert_types');
const { rawSubDb, Reset, streamPromise } = require('./base');
const geo = require('level-geospatial');
const promises_ = __.require('lib', 'promises');

module.exports = function(dbName){
  const sub = rawSubDb(dbName);
  const db = geo(sub);
  const API = promises_.promisify(db, [ 'get', 'getByKey', 'put', 'del' ]);
  API.reset = Reset(sub);
  API.search = Search(db);

  return API;
};

var Search = db => (function(latLng, kmRange) {
  assert_.types([ 'array', 'number' ], arguments);
  const [ lat, lon ] = Array.from(latLng);
  return streamPromise(db.search({ lat, lon }, kmRange * 1000));
});
