CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Lang } = __.require 'lib', 'regex'
{ pass, email } = require './common'

module.exports = {
  pass,
  email,
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
}
