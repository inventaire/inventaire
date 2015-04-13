CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ Lang } = require './regex'
{ email } = require './common-tests'

module.exports =
  email: email
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
