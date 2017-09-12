CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Lang } = require './regex'
{ pass, email } = require './common'

module.exports =
  pass: pass
  email: email
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
