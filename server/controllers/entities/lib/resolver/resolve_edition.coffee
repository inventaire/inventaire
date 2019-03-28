CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByIsbns = require '../get_entities_by_isbns'

module.exports = (entry)->
  { edition } = entry
  { isbn } = edition

  unless isbn? then return Promise.resolved

  getEntitiesByIsbns [ isbn ], refresh = {}
  .then (res)->
    { entities } = res
    if entities.length is 1
      # return only one uri, as entity isbn should be unique
      entry.edition.uri = entities[0].uri
  .then -> entry
