# Tries to identify an author from the occurrences of their works labels
# in their Wikipedia article. It can thus only work for authors known by Wikidata

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
typeSearch = __.require 'controllers', 'search/lib/type_search'
prefixify = __.require 'lib', 'wikidata/prefixify'
hasWorksLabelsOccurrence = require './has_works_labels_occurrence'

# Returns a URI if an single author was identified
# returns undefined otherwise
module.exports = (authorStr, worksLabels, worksLabelsLangs)->
  searchHumans authorStr
  .then getWdAuthorUris
  .map getAuthorOccurrenceData(worksLabels, worksLabelsLangs)
  .filter _.property('hasOccurrence')
  .then (authorsData)->
    if authorsData.length is 0 then return
    else if authorsData.length is 1
      { uri } = authorsData[0]
      _.log uri, 'author found from work label'
      return uri
    else
      context = { authorStr, authorsData, worksLabels, worksLabelsLangs }
      _.warn context, 'found more than one matching author'
      return

searchHumans = typeSearch.bind null, [ 'humans' ]

getWdAuthorUris = (res)->
  res.hits.hits
  .filter (hit)-> hit._index is 'wikidata' and hit._score > 1
  .map (hit)-> prefixify hit._id

getAuthorOccurrenceData = (worksLabels, worksLabelsLangs)-> (wdAuthorUri)->
  hasWorksLabelsOccurrence wdAuthorUri, worksLabels, worksLabelsLangs
  .then (hasOccurrence)-> { uri: wdAuthorUri, hasOccurrence }
