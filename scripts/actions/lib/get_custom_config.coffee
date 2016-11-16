CONFIG = require 'config'
{ extend } = require 'lodash'
# Override the database settings with the settings from the database targeted
# by the current action. Customize to your needs in local.coffee
extend CONFIG.db, CONFIG.db.actionsScripts
module.exports = CONFIG
