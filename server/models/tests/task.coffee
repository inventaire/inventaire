CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, entityUri } = require './common'

module.exports =
  pass: pass
  suspect: entityUri
