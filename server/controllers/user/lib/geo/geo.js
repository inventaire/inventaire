// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const db = __.require('level', 'geo')('geo')

module.exports = () => {
  // Start following for changes
  let API
  require('./follow')(db)

  return API =
    { search (latLng, kmRange) { return db.search(latLng, kmRange) } }
}
