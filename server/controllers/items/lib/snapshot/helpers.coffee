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

  getAuthorsNames: (preferedLang, authors)->
    authors
    .map getName(preferedLang)
    .join ', '

getName = (lang)-> (author)->
  getBestLangValue(lang, author.originalLang, author.labels).value
