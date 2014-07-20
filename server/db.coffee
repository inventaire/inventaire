CONFIG = require('config')
nano = require('nano') CONFIG.db.fullHost()
H = db: require './helpers/db'

H.db.checkDbsExistanceOrCreate [CONFIG.db.users, CONFIG.db.inv]

module.exports = nano.db