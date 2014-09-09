CONFIG = require('config')
nano = require('nano') CONFIG.db.fullHost()
H = db: require './helpers/db'

if CONFIG.db.instable
  H.db.checkDbsExistanceOrCreate [CONFIG.db.users, CONFIG.db.inv]
else _.logBlue 'DBs assumed to exist'

module.exports = nano.db