__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
getEntityType = __.require 'lib', 'wikidata/get_entity_type'
{ normalizeIsbn } = __.require 'lib', 'isbn/isbn'

module.exports = (ids)->
  # Hypothesis: there is no need to look for Wikidata data here
  # as inv entities with an associated Wikidata entity use the Wikidata uri
  entities_.byIds ids
  .map format
  .then (entities)-> { entities }

format = (entity)->
  wdId = entity.claims['invp:P1']?[0]
  isbn = entity.claims['wdt:P212']?[0]

  # Those URIs are aliases but, when available, always use the Wikidata id
  # or the ISBN
  if wdId?
    entity.uri = "wd:#{wdId}"
    entity.redirectedFrom = "inv:#{entity._id}"
  else if isbn?
    # By internal convention, ISBN URIs are without hyphen
    entity.uri = "isbn:#{normalizeIsbn(isbn)}"
    entity.redirectedFrom = "inv:#{entity._id}"
  else
    entity.uri = "inv:#{entity._id}"

  entity.type = getEntityType entity.claims['wdt:P31']
  return entity
