__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'
{ getSimpleDayDate, sortByDate } = require './queries_utils'
{ types, typesNames, getTypePluralNameByTypeUri } = __.require 'lib', 'wikidata/aliases'

whitelistedTypesNames = [ 'series', 'books', 'articles' ]

module.exports = (uri, refresh)->
  [ prefix, id ] = uri.split ':'
  promises = []

  worksByTypes = initWorksByTypes()

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd' then promises.push getWdAuthorWorks(id, worksByTypes, refresh)

  promises.push getInvAuthorWorks(uri, worksByTypes)

  promises_.all promises
  .then formatResults.bind(null, worksByTypes)
  .catch _.ErrorRethrow('get author works err')

initWorksByTypes = ->
  worksByTypesBase = {}
  for name in whitelistedTypesNames
    worksByTypesBase[name] = []
  return worksByTypesBase

getWdAuthorWorks = (qid, worksByTypes, refresh)->
  runWdQuery { query: 'author-works', qid, refresh }
  .then spreadWdResultsByTypes.bind(null, worksByTypes)

spreadWdResultsByTypes = (worksByTypes, results)->
  for result in results
    { work:wdId, type:typeWdId, date } = result
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    typeUri = "wd:#{typeWdId}"
    typeName = getTypePluralNameByTypeUri typeUri
    if typeName in whitelistedTypesNames
      date = getSimpleDayDate date
      worksByTypes[typeName].push { uri: "wd:#{wdId}", date }
    else
      _.warn wdId, "ignored type: #{typeWdId}"

  return

getInvAuthorWorks = (uri, worksByTypes)->
  entities_.byClaim 'wdt:P50', uri
  .then spreadInvResultsByTypes.bind(null, worksByTypes)

spreadInvResultsByTypes = (worksByTypes, res)->
  for row in res.rows
    typeUri = row.value
    typeName = getTypePluralNameByTypeUri typeUri
    if typeName in whitelistedTypesNames
      uri = "inv:#{row.id}"
      worksByTypes[typeName].push { uri }

  return

formatResults = (worksByTypes)->
  for name, results of worksByTypes
    worksByTypes[name] = results.sort sortByDate
  return worksByTypes
