CONFIG = require('config')
__ = CONFIG.universalPath

params =
  hostname: CONFIG.db.host
  port: CONFIG.db.port
  auth: CONFIG.db.auth()
  debug: CONFIG.db.debug

if CONFIG.db.protocol is 'https'
  params.ssl = true

module.exports = require('inv-cot')(params)