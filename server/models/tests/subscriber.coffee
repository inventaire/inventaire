CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ Email } = require './common-tests'

module.exports =
  email: (email)-> Email.test(email)
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
