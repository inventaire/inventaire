CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
i18n = require './i18n/i18n'

appApi = require './app_api'
module.exports = hb_ = __.require('sharedLibs', 'handlebars_helpers')(_, appApi)

_.extend hb_, i18n,
  # Prevent passing more than 2 arguments
  debug: (obj, label)->
    _.log obj, label
    return JSON.stringify(obj, null, 2)
