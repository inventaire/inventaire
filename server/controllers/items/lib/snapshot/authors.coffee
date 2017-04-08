__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
{ Promise } = __.require 'lib', 'promises'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)

module.exports = authors_ =
  # Using getEntityByUri instead of getEntitiesByUris to keep the order
  getEntities: (wdtP50)-> Promise.all wdtP50.map(getEntityByUri)

  getNamesFromEntities: (preferedLang, authors)->
    authors
    .map getName(preferedLang)
    .join ', '

  getNames: (wdtP50, preferedLang)->
    unless _.isNonEmptyArray wdtP50 then return Promise.resolve ''
    authors_.getEntities wdtP50
    .then authors_.getNamesFromEntities.bind(null, preferedLang)

getName = (lang)-> (author)->
  getBestLangValue(lang, author.originalLang, author.labels).value
