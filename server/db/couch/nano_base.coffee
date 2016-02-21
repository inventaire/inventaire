CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')

nano = require('nano') CONFIG.db.fullHost()
nanoMethods = require './nano_methods'

module.exports = (dbName)->
  db = nano.db.use(dbName)
  return nanoMethods(db)
