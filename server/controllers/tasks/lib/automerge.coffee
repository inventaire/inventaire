__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
areTrustedOccurences = require './are_trusted_occurences'
# Merge if enough confidence between the suspect and one suggestion
# If confidence is too low, return best suggestions for task creation

module.exports = (suspect, workLabelsByLang)-> (suggestions)->
  workLabels = _.values workLabelsByLang
  if authorNameInWorkTitles(suspect.labels, workLabels) then return suggestions
  sourcedSuggestions = suggestions.filter (sug)-> sug.occurrences.length > 0

  for suggestion in sourcedSuggestions
    # Merge suggestion with more than 2 occurences, since only two wikipedias are checked
    if suggestion.occurences? and areTrustedOccurences suggestion.occurences
      return mergeEntities reconcilerUserId, suspect.uri, suggestion.uri
      .then -> []

  if sourcedSuggestions.length is 0
    return suggestions
  else if sourcedSuggestions.length > 1
    return sourcedSuggestions
  else
    # Only one suggestion, automerge possible
    suggestion = sourcedSuggestions[0]
    unless canBeAutomerged(suggestion) then return sourcedSuggestions
    mergeEntities reconcilerUserId, suspect.uri, suggestion.uri
    # No suggestions since merged suspect
    .then -> []

authorNameInWorkTitles = (authorLabels, workLabels)->
  # Unable to define if occurences are relevant
  # since author name will be found on external source pages
  for authorLabel in _.values(authorLabels)
    for workLabel in workLabels
      if workLabel.match(authorLabel)? then return true

canBeAutomerged = (suggestion)->
  matchedTitles =  _.flatten _.map(suggestion.occurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > 12
