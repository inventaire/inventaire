__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (suspectUri)-> (suggestions)->
  suggestionsWithOccurrences = suggestions.filter hasOccurrences
  _.log suggestionsWithOccurrences, 'suggestionsWithOccurrences'
  # No suggestion has occurrences, all should get a task
  if suggestionsWithOccurrences.length is 0 then return suggestions
  # Some suggestions have occurrences, those only should get a task
  if suggestionsWithOccurrences.length > 1 then return suggestionsWithOccurrences
  # Else, only the one that has occurrences should either be automerged or get a task
  suggestionWithOccurrences = suggestionsWithOccurrences[0]
  unless canBeAutomerged suggestionWithOccurrences then return suggestionsWithOccurrences

  foundUri = suggestionWithOccurrences.uri
  _.log { suspectUri, foundUri }, 'automerging'
  mergeEntities reconcilerUserId, suspectUri, foundUri
  # No task should be created
  .then -> return []

hasOccurrences = (suggestion)-> suggestion.occurrences.length > 0

canBeAutomerged = (suggestion)->
  matchedTitles =  _.flatten _.map(suggestion.occurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > 12
