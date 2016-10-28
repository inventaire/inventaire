__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
getEntityType = __.require 'lib', 'wikidata/get_entity_type'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
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

  invUri = "inv:#{entity._id}"

  # Those URIs are aliases but, when available, always use the Wikidata id
  # or the ISBN
  if wdId? then entity.uri = "wd:#{wdId}"
  # By internal convention, ISBN URIs are without hyphen
  else if isbn? then entity.uri = "isbn:#{normalizeIsbn(isbn)}"
  else entity.uri = invUri

  if entity.uri isnt invUri
    entity.redirects =
      from: invUri
      to: entity.uri

  entity.type = getEntityType entity.claims['wdt:P31']
  entity.originalLang = getOriginalLang entity.claims

  # Matching Wikidata entities format for images
  # Here we are missing license, credits, and author attributes
  entity.image =
    url: entity.claims['wdt:P18']?[0]

  return entity
