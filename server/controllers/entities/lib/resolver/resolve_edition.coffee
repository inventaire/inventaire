CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByIsbns = require '../get_entities_by_isbns'

module.exports = (edition)->
  { isbn } = edition

  unless isbn? then return Promise.resolved

  getEntitiesByIsbns [ isbn ], refresh = {}
  .then (res)->
    { entities } = res
    if _.some entities
      # should return only one uri as edition entity isbn is unique
      edition.uri = entities[0].uri
