__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'

# Merge if enough confidence between the suspect and one suggestion
# If confidence is too low, return best suggestions for task creation

module.exports = (suspect, workLabelsByLang)-> (suggestions)->
  workLabels = _.values workLabelsByLang
  if authorNameInWorkTitles(suspect.labels, workLabels) then return suggestions
  sourcedSuggestions = suggestions.filter (sug)-> occurrencesCount(sug) > 0

  for suggestion in sourcedSuggestions
    # Merge suggestion with more than 2 occurences, since only two wikipedias are checked
    if occurrencesCount(suggestion) > 2
      return mergeEntities reconcilerUserId, suspect.uri, suggestion.uri
      .then -> []

  if noSuggestion sourcedSuggestions
    return suggestions
  else if manySuggestions sourcedSuggestions
    return sourcedSuggestions
  else
    # Only one suggestion, automerge possible
    uniqSuggestion = sourcedSuggestions[0]

    unless canBeAutomerged(uniqSuggestion) then return sourcedSuggestions

    mergeEntities reconcilerUserId, suspect.uri, uniqSuggestion.uri
    # No suggestions since merged suspect
    .then -> []

noSuggestion = (sug)->  sug.length is 0

manySuggestions = (sug)-> sug.length > 1

authorNameInWorkTitles = (authorLabels, workLabels)->
  # Unable to define if occurences are relevant
  # since author name will be found on external source pages
  for authorLabel in _.values(authorLabels)
    for workLabel in workLabels
      if workLabel.match(authorLabel)? then return true

occurrencesCount = (suggestion)-> suggestion.occurrences.length

canBeAutomerged = (suggestion)->
  matchedTitles =  _.flatten _.map(suggestion.occurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > 12
