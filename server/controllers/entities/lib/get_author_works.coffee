__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'

whitelistedTypes =
  series: 'wd:Q277759'
  books: 'wd:Q571'
  articles: 'wd:Q191067'

whitelistedTypesUris = _.values whitelistedTypes

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
  worksByTypes = {}
  for name, uri of whitelistedTypes
    worksByTypes[uri] = []
  return worksByTypes

getWdAuthorWorks = (qid, worksByTypes, refresh)->
  runWdQuery { query: 'author-works', qid, refresh }
  .then spreadWdResultsByTypes.bind(null, worksByTypes)

spreadWdResultsByTypes = (worksByTypes, results)->
  for result in results
    { work:wdId, type, date } = result
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    if "wd:#{type}" in whitelistedTypesUris
      date = date?.split('T')[0].replace '-01-01', ''
      worksByTypes["wd:#{type}"].push { uri: "wd:#{wdId}", date }

  return

getInvAuthorWorks = (uri, worksByTypes)->
  entities_.byClaim 'wdt:P50', uri
  .then spreadInvResultsByTypes.bind(null, worksByTypes)

spreadInvResultsByTypes = (worksByTypes, res)->
  for row in res.rows
    type = row.value
    if type in whitelistedTypesUris
      uri = "inv:#{row.id}"
      worksByTypes[type].push { uri }

  return

formatResults = (worksByTypes)->
  results = {}
  for name, uri of whitelistedTypes
    _.log worksByTypes[uri], "worksByTypes[uri] #{uri}"
    results[name] = worksByTypes[uri].sort sortByDate
  return results

sortByDate = (a, b)-> formatSortDate(a.date) - formatSortDate(b.date)
formatSortDate = (date)-> parseInt(date?.split('-')[0] or latestYear)
# If no date is available, make it appear last by providing a date in the future
# To update once we will have passed the year 2100
latestYear = '2100'
