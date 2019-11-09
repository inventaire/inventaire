__ = require('config').universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
getBestLangValue = __.require 'lib', 'get_best_lang_value'

module.exports =
  getDocData: (updatedDoc)->
    { uri, type } = updatedDoc
    # Case when a formatted entity doc is passed
    if uri? then return [ uri, type ]

    # Case when a raw entity doc is passed,
    # which can only be an inv entity doc
    uri = getInvEntityCanonicalUri updatedDoc
    domain = if uri.startsWith('wd') then 'wd' else 'inv'
    type = getEntityType[domain](updatedDoc.claims)
    return [ uri, type ]

  getNames: (preferedLang, entities)->
    unless _.isNonEmptyArray entities then return

    entities
    .map getName(preferedLang)
    .join ', '

  aggregateClaims: (entities, property)->
    assert_.array entities
    assert_.string property

    _(entities)
    .filter (entity)->
      hasClaims = entity.claims?
      if hasClaims then return true
      # Trying to identify how entities with no claims arrive here
      _.warn entity, 'entity with no claim at aggregateClaims'
      return false
    .map (entity)-> entity.claims[property]
    .flatten()
    .compact()
    .uniq()
    .value()

getName = (lang)-> (entity)->
  getBestLangValue(lang, entity.originalLang, entity.labels).value
