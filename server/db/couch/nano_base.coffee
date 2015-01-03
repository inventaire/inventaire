CONFIG = require('config')
__ = CONFIG.root
_ = __.require('builders', 'utils')

nano = require('nano') CONFIG.db.fullHost()
couch_ = __.require 'couch', 'couch_handler'

if CONFIG.db.instable
  dbs = [CONFIG.db.users, CONFIG.db.inventory, CONFIG.db.entities]
  couch_.checkDbsExistanceOrCreate dbs
else
  _.info 'DBs assumed to exist'

if CONFIG.db.reloadDesignDocs
  _.info 'updating _design Docs'
  couch_.reloadDesignDocs()

module.exports = nano.db