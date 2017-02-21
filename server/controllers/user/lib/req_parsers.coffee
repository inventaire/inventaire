CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports =
  findLanguage: (req)->
    accept = req.headers['accept-language']
    language = accept?.split?(',')[0]
    if User.tests.language(language) then language
