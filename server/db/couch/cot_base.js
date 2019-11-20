const CONFIG = require('config')

const params = {
  hostname: CONFIG.db.host,
  port: CONFIG.db.port,
  auth: CONFIG.db.auth(),
  debug: CONFIG.db.debug
}

if (CONFIG.db.protocol === 'https') {
  params.ssl = true
}

module.exports = require('blue-cot')(params)
