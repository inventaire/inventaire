CONFIG = require('config')
__ = CONFIG.root
_ = __.require('builders', 'utils')

nano = require('nano') CONFIG.db.fullHost()
_db = __.require 'db', 'couch_handler'

if CONFIG.db.instable
  _db.checkDbsExistanceOrCreate [CONFIG.db.users, CONFIG.db.inventory]
else
  _.info 'DBs assumed to exist'

if CONFIG.db.reloadDesignDocs
  _.info 'updating _design Docs'
  _db.reloadDesignDocs()

module.exports = nano.db