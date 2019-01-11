__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'

# Merge automatically if enough confidence between suspect and suggestion
# If confidence is too low, return best suggestions for task creation

module.exports = (suspect, workLabels)-> (suggestions)->
  # unable to define if occurences are relevant
  # since author name will be found on external
  # source pages
  if authorNameInWorkTitles(suspect.labels, workLabels) then return suggestions

  sourcedSuggestions = suggestions.filter hasOccurrences

  if noSuggestion sourcedSuggestions
    return suggestions
  else if manySuggestions sourcedSuggestions
    return sourcedSuggestions
  else
    # Only one suggestion, automerge possible
    uniqSuggestion = sourcedSuggestions[0]
    unless canBeAutomerged uniqSuggestion
      return sourcedSuggestions


  mergeEntities reconcilerUserId, suspect.uri, uniqSuggestion.uri
  # No suggestions since merged suspect
  .then -> return []

noSuggestion = (sug)->  sug.length is 0

manySuggestions = (sug)-> sug.length > 1

authorNameInWorkTitles = (authorLabels, workLabels)->
  works = _.values workLabels
  authors = _.values authorLabels
  for author in authors
    for work in works
      if work.indexOf(author) > -1
        return true

hasOccurrences = (suggestion)-> suggestion.occurrences.length > 0

canBeAutomerged = (suggestion)->
  matchedTitles =  _.flatten _.map(suggestion.occurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > 12
