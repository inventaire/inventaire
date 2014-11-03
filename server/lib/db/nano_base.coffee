CONFIG = require('config')
__ = CONFIG.root
_ = __.require('builders', 'utils')

nano = require('nano') CONFIG.db.fullHost()
_db = __.require 'lib', 'db'

if CONFIG.db.instable
  _db.checkDbsExistanceOrCreate [CONFIG.db.users, CONFIG.db.inventory]
else _.logBlue 'DBs assumed to exist'

module.exports = nano.db