// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')
const { rawSubDb, Reset, streamPromise } = require('./base')
const geo = require('level-geospatial')
const promises_ = __.require('lib', 'promises')

module.exports = dbName => {
  const sub = rawSubDb(dbName)
  const db = geo(sub)
  const API = promises_.promisify(db, [ 'get', 'getByKey', 'put', 'del' ])
  API.reset = Reset(sub)
  API.search = Search(db)

  return API
}

const Search = db => (latLng, kmRange) => {
  assert_.array(latLng)
  assert_.number(kmRange)
  const [ lat, lon ] = Array.from(latLng)
  return streamPromise(db.search({ lat, lon }, kmRange * 1000))
}
