CONFIG = require('config')
__ = CONFIG.root
_ = __.require('builders', 'utils')

nano = require('nano') CONFIG.db.fullHost()
couch_ = __.require 'couch', 'couch_handler'

if CONFIG.db.instable
  couch_.checkDbsExistanceOrCreate [CONFIG.db.users, CONFIG.db.inventory]
else
  _.info 'DBs assumed to exist'

if CONFIG.db.reloadDesignDocs
  _.info 'updating _design Docs'
  couch_.reloadDesignDocs()

module.exports = nano.db