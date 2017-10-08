CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntitiesByIsbns = require './get_entities_by_isbns'

module.exports = (query)->
  { isbn, refresh } = query
  getEntitiesByIsbns [ isbn ], refresh
  .then _.Log('getEntitiesByIsbns resp')
  .then (resp)->
    { entities } = resp
    entities = _.values entities
    if entities.length is 1 then return entities
    else throw error_.notFound query
