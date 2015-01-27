CONFIG = require 'config'
cot = require 'cot'

params =
  hostname: CONFIG.db.host
  port: CONFIG.db.port
  auth: CONFIG.db.auth()

if CONFIG.db.protocol is 'https'
  params.ssl = true

module.exports =
  users: new cot(params).db CONFIG.db.name('users')
  items: new cot(params).db CONFIG.db.name('items')
  entities: new cot(params).db CONFIG.db.name('entities')
