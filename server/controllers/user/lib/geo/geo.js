const CONFIG = require('config')
const __ = CONFIG.universalPath
const db = __.require('level', 'geo')('geo')

module.exports = () => {
  // Start following for changes
  if (CONFIG.serverMode) require('./follow')()

  return {
    search: (latLng, kmRange) => db.search(latLng, kmRange)
  }
}
