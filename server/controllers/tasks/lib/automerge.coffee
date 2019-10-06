__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
automergeWorks = require './automerge_works'
longTitleLimit = 12

# Merge if perfect matched of works title and if title is long enough
module.exports = (suspectUri, suggestion)->
  { uri:suggestionUri } = suggestion
  unless validateAutomerge(suggestion.occurrences)
    return [ suggestion ]

  mergeEntities reconcilerUserId, suspectUri, suggestionUri
  .then -> automergeWorks suggestionUri
  .then -> return [] # merged suspect

validateAutomerge = (suggestionOccurrences)->
  matchedTitles =  _.flatten _.map(suggestionOccurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > longTitleLimit

findSourced = (suggestions)->
  suggestions.filter (sug)-> sug.occurrences.length > 0
