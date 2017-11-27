CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, entityUri, nonEmptyString } = require './common'

module.exports =
  pass: pass
  suspect: entityUri


