__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = require '../items'
entities_ = __.require 'controllers','entities/lib/entities'
getInvEntityCanonicalUri = __.require 'controllers', 'entities/lib/get_inv_entity_canonical_uri'
authors_ = require './authors'
{ Promise } = __.require 'lib', 'promises'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'

module.exports = (uri)->
  # Updating all the items that have a work from this author for entity
  # or an edition of one of those works
  entities_.byClaim 'wdt:P50', uri, true, true
  .map updateWorkAndEditionsAuthors
  .then _.flatten
  .then (updatedItems)->
    if updatedItems.length > 0 then items_.db.bulk updatedItems
  .catch _.Error('updateAuthorsNames err')

updateWorkAndEditionsAuthors = (workDoc)->
  workUri = "inv:#{workDoc._id}"
  Promise.all [
    authors_.getEntities workDoc.claims['wdt:P50']
    getEditions workUri
  ]
  .spread (authorsEntities, editionsDoc)->
    Promise.all [
      getWorkUpdatedItems workUri, authorsEntities
      getEditionsUpdatedItems(editionsDoc, authorsEntities)
    ]
    .then _.flatten

getEditions = (workUri)-> entities_.byClaim 'wdt:P629', workUri, true, true

getWorkUpdatedItems = (workUri, authorsEntities)->
  items_.byEntity workUri
  .map (item)->
    lang = item.lang or 'en'
    authorsString = authors_.getNamesFromEntities lang, authorsEntities
    item.snapshot['entity:authors'] = authorsString
    return item

getEditionsUpdatedItems = (editionsDoc, authorsEntities)->
  Promise.all editionsDoc.map(getEditionUpdatedItems(authorsEntities))
  .then _.flatten

getEditionUpdatedItems = (authorsEntities)-> (editionDoc)->
  [ editionUri ] = getInvEntityCanonicalUri editionDoc
  items_.byEntity editionUri
  .map (item)->
    lang = getOriginalLang(editionDoc.claims) or 'en'
    authorsString = authors_.getNamesFromEntities lang, authorsEntities
    item.snapshot['entity:authors'] = authorsString
    return item
