__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'
prefixify = __.require 'lib', 'wikidata/prefixify'
{ getSimpleDayDate, sortByDate } = require './queries_utils'
{ types, typesNames, getTypePluralNameByTypeUri } = __.require 'lib', 'wikidata/aliases'

whitelistedTypesNames = [ 'series', 'works', 'articles' ]

module.exports = (uri, refresh)->
  _.types arguments, ['string', 'boolean|undefined'], 1
  [ prefix, id ] = uri.split ':'
  promises = []

  worksByTypes = _.initCollectionsIndex whitelistedTypesNames

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd' then promises.push getWdAuthorWorks(id, worksByTypes, refresh)

  promises.push getInvAuthorWorks(uri, worksByTypes)

  promises_.all promises
  .then formatResults.bind(null, worksByTypes)
  .catch _.ErrorRethrow('get author works err')

getWdAuthorWorks = (qid, worksByTypes, refresh)->
  runWdQuery { query: 'author-works', qid, refresh }
  .then spreadWdResultsByTypes.bind(null, worksByTypes)

# TODO: prevent a work with several wdt:P577 values to appear several times
# ex: https://inventaire.io/api/entities?action=serie-parts&uri=wd:Q8337
spreadWdResultsByTypes = (worksByTypes, results)->
  ids = {}
  for result in results
    { work:wdId, type:typeWdId, date, serie } = result
    typeUri = "wd:#{typeWdId}"
    typeName = getTypePluralNameByTypeUri typeUri
    if typeName in whitelistedTypesNames
      ids[typeName] or= []
      if wdId in ids[typeName]
        # Known case: when an entity has two P31 values that both
        # resolve to the same whitelisted type
        # ex: Q23701761 → P31 → Q571/Q17518461
        _.warn wdId, "duplicated id: #{wdId}"
      else
        ids[typeName].push wdId
        date = getSimpleDayDate date
        serie = prefixify serie
        worksByTypes[typeName].push { uri: "wd:#{wdId}", date, serie }
    else
      _.warn wdId, "ignored type: #{typeWdId}"

  return

getInvAuthorWorks = (uri, worksByTypes)->
  entities_.byClaim 'wdt:P50', uri, true
  .then spreadInvResultsByTypes.bind(null, worksByTypes)

spreadInvResultsByTypes = (worksByTypes, res)->
  for row in res.rows
    typeUri = row.value
    typeName = getTypePluralNameByTypeUri typeUri
    if typeName in whitelistedTypesNames
      worksByTypes[typeName].push
        uri: "inv:#{row.id}"
        date: row.doc.claims['wdt:P577']?[0]
        serie: row.doc.claims['wdt:P179']?[0]

  return

formatResults = (worksByTypes)->
  for name, results of worksByTypes
    worksByTypes[name] = results.sort sortByDate
  return worksByTypes
