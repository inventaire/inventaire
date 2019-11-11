__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
automergeAuthorWorks = require './automerge_author_works'
longTitleLimit = 12

# Merge if perfect matched of works title and if title is long enough
module.exports = (suspectUri, suggestion)->
  { uri:suggestionUri } = suggestion
  unless isValidateAutomerge(suggestion.occurrences)
    return [ suggestion ]

  _.log { suspectUri, suggestionUri }, 'automerging'

  mergeEntities reconcilerUserId, suspectUri, suggestionUri
  # Give the time to CouchDB to update its views so that the works
  # of the merged author are correctly found
  .delay 100
  .then -> automergeAuthorWorks suggestionUri
  .then -> return [] # merged suspect

isValidateAutomerge = (suggestionOccurrences)->
  hasOccurencesInStructuredDataSources =  _.some _.map(suggestionOccurrences, 'structuredDataSource')
  if hasOccurencesInStructuredDataSources then return true

  matchedTitles =  _.flatten _.map(suggestionOccurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > longTitleLimit

findSourced = (suggestions)->
  suggestions.filter (sug)-> sug.occurrences.length > 0
