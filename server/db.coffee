CONFIG = require('config')
nano = require('nano')(CONFIG.dbFullHost)
H = db: require './helpers/db'

H.db.checkDbsExistanceOrCreate ['inventory', 'users']

module.exports = nano.db