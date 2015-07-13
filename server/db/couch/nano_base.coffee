CONFIG = require('config')
__ = CONFIG.root
_ = __.require('builders', 'utils')

nano = require('nano') CONFIG.db.fullHost()
couch_ = __.require 'couch', 'couch_handler'

if CONFIG.db.unstable
  couch_.checkDbsExistanceOrCreate()
else
  _.info 'DBs assumed to exist'

if CONFIG.db.reloadDesignDocs
  _.info 'updating _design Docs'
  couch_.reloadDesignDocs()

nanoMethods = require './nano_methods'

module.exports = (dbName)->
  db = nano.db.use(dbName)
  return nanoMethods(db)