CONFIG = require 'config'
__ = CONFIG.universalPath
module.exports = __.require('client', 'scripts/lib/i18n/langs').active
