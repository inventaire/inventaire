__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'

module.exports = (uri, refresh)->
  [ prefix, id ] = uri.split ':'
  promises = []

  worksByTypes = {}

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd' then promises.push getWdAuthorWorks(id, worksByTypes, refresh)

  promises.push getInvAuthorWorks(uri, worksByTypes)

  promises_.all promises
  .then ->
    # Returning only books for now
    books: worksByTypes['wd:Q571'].sort sortByDate

getWdAuthorWorks = (qid, worksByTypes, refresh)->
  runWdQuery { query: 'author-works', qid, refresh }
  .then spreadWdResultsByTypes.bind(null, worksByTypes)

spreadWdResultsByTypes = (worksByTypes, results)->
  for result in results
    { work:wdId, type, date } = result
    # If the date is a January 1st, it's very probably because
    # its a year-precision date
    date = date?.split('T')[0].replace '-01-01', ''
    worksByTypes["wd:#{type}"] or= []
    worksByTypes["wd:#{type}"].push { uri: "wd:#{wdId}", date }

  return

getInvAuthorWorks = (uri, worksByTypes)->
  entities_.byClaim 'wdt:P50', uri
  .then spreadInvResultsByTypes.bind(null, worksByTypes)

spreadInvResultsByTypes = (worksByTypes, res)->
  for row in res.rows
    type = row.value
    uri = row.key[1]
    worksByTypes[row.value] or= []
    worksByTypes[row.value].push { uri }

  return

sortByDate = (a, b)-> formatSortDate(a.date) - formatSortDate(b.date)
formatSortDate = (date)-> parseInt(date?.split('-')[0] or latestYear)
# If no date is available, make it appear last by providing a date in the future
# To update once we will have passed the year 2100
latestYear = '2100'
