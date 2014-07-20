CONFIG = require 'config'
cot = require('cot')

module.exports.users = new cot({hostname: CONFIG.db.host, port: CONFIG.db.port}).db(CONFIG.db.users)
module.exports.inv = new cot({hostname: CONFIG.db.host, port: CONFIG.db.port}).db(CONFIG.db.inv)