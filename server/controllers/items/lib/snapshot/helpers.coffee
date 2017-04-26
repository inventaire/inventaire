__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityType = __.require 'controllers', 'entities/lib/get_entity_type'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)

module.exports =
  getDocData: (updatedDoc)->
    [ uri ] = getInvEntityCanonicalUri updatedDoc
    type = getEntityType updatedDoc.claims['wdt:P31']
    return [ uri, type ]

  addSnapshot: (item, updatedSnapshot)->
    item.snapshot or= {}
    # Keep snapshot fields that would be missing on the new snapshot
    # Known case: entity:image that aren't defined on works anymore
    item.snapshot = _.extend item.snapshot, updatedSnapshot
    return item

  getNames: (preferedLang, entities)->
    unless _.isNonEmptyArray entities then return

    entities
    .map getName(preferedLang)
    .join ', '

getName = (lang)-> (entity)->
  getBestLangValue(lang, entity.originalLang, entity.labels).value
