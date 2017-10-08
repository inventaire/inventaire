# Gathering entity formatting steps common to all the consumers
# Keep in sync with get_wikidata_enriched_entities formatting
__ = require('config').universalPath
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
getEntityImagesFromClaims = require './get_entity_images_from_claims'

module.exports = (entity)->
  entity.originalLang = getOriginalLang entity.claims

  # Matching Wikidata entities format for images
  # Here we are missing license, credits, and author attributes
  entity.image =
    url: getEntityImagesFromClaims(entity)[0]

  return entity
