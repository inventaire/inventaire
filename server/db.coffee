CONFIG = require('config')
_ = CONFIG.root.require('builders', 'utils')

nano = require('nano') CONFIG.db.fullHost()
lib =
  db: __.require 'lib', 'db'

if CONFIG.db.instable
  lib.db.checkDbsExistanceOrCreate [CONFIG.db.users, CONFIG.db.inv]
else _.logBlue 'DBs assumed to exist'

module.exports = nano.db