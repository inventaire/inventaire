CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
i18n = require './i18n/i18n'

module.exports = hb_ = __.require('sharedLibs', 'handlebars_helpers')(_)

_.extend hb_, i18n,
  debug: ->
    console.log('this', this)
    console.log('arguments', arguments)
