CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'

params =
  hostname: CONFIG.db.host
  port: CONFIG.db.port
  auth: CONFIG.db.auth()

if CONFIG.db.protocol is 'https'
  params.ssl = true

module.exports = require('inv-cot')(params)