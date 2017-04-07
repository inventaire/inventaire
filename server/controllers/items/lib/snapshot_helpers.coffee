__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
{ Promise } = __.require 'lib', 'promises'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)

# Using getEntityByUri instead of getEntitiesByUris to keep the order
getAuthorsEntities = (wdtP50)-> Promise.all wdtP50.map(getEntityByUri)

getNamesStringFromAuthorsEntities = (preferedLang, authors)->
  authors
  .map getAuthorsName(preferedLang)
  .join ', '

getAuthorsNamesString = (wdtP50, preferedLang)->
  unless _.isNonEmptyArray wdtP50 then return Promise.resolve ''
  getAuthorsEntities wdtP50
  .then getNamesStringFromAuthorsEntities.bind(null, preferedLang)

getAuthorsName = (lang)-> (author)->
  getBestLangValue(lang, author.originalLang, author.labels).value

module.exports = {
  getAuthorsEntities,
  getNamesStringFromAuthorsEntities,
  getAuthorsNamesString
}
