__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
areTrustedOccurences = require './are_trusted_occurences'
# Merge if enough confidence between the suspect and one suggestion
# If confidence is too low, return best suggestions for task creation

module.exports = (suspect, workLabelsByLang)-> (suggestions)->
  if suggestions.length is 0 then return []
  workLabels = _.values workLabelsByLang
  if authorNameInWorkTitles(suspect.labels, workLabels) then return suggestions
  # get suggestions with at least 2 occurences from trustworthy domains
  trustedSuggestions = suggestions.filter (sug)-> areTrustedOccurences(sug.occurrences)
  if trustedSuggestions.length is 1
    return mergeEntities reconcilerUserId, suspect.uri, trustedSuggestions[0].uri
    .then -> []
  suggestions = suggestions.filter (sug)-> sug.occurrences.length > 0
  # Cannot merge if several suggestions have occurences
  if suggestions.length > 1 then return suggestions
  uniqSuggestion = suggestions[0]
  # or when title is long enoughœ
  if canBeAutomerged(uniqSuggestion)
    return mergeEntities reconcilerUserId, suspect.uri, uniqSuggestion.uri
    .then -> []
  suggestions

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
