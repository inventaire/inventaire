__ = require('config').universalPath
_ = __.require 'builders', 'utils'
areTrustedOccurrences = require './are_trusted_occurrences'
# Merge if enough trust between the suspect and a suggestion
# If confidence is too low or several suggestions are trusted,
# return best suggestions for task creation

module.exports = (suspect, workLabelsByLang)-> (suggestions)->
  if suggestions.length is 0 then return {}
  if authorNameInWorkTitles(suspect.labels, workLabelsByLang) then return { suggestions }
  { uri : suspectUri } = suspect

  # Get suggestions with at least 2 occurrences from trustworthy domains
  trustedSuggestions = suggestions.filter hasTrustedOccurrences
  if trustedSuggestions.length is 1
    return mergeData suspectUri, trustedSuggestions[0].uri

  suggestionsWithOccurrences = suggestions.filter hasOccurrence

  # Cannot merge if several suggestions have occurrences
  if suggestionsWithOccurrences.length > 1
    return { suggestions: suggestionsWithOccurrences }

  uniqSuggestionWithOccurrence = suggestionsWithOccurrences[0]

  # Merge when title is long enough
  if canBeAutomerged uniqSuggestionWithOccurrence
    return mergeData suspectUri, uniqSuggestionWithOccurrence.uri

  return { suggestions: suggestionsWithOccurrences }

mergeData = (from, to)-> { merge: { from, to } }
suggestionsData = (suggestions)-> { suggestions }

hasTrustedOccurrences = (sug)-> areTrustedOccurrences(sug.occurrences)
hasOccurrence = (sug)-> sug.occurrences.length > 0

authorNameInWorkTitles = (authorLabels, workLabelsByLang)->
  # when author name and work title are the same, occurrences can not be relevant
  # ie. on wikipedia, work titles will be confused with authors name page
  workLabels = _.values workLabelsByLang
  for authorLabel in _.values(authorLabels)
    for workLabel in workLabels
      if workLabel.match(authorLabel)? then return true

canBeAutomerged = (suggestion)->
  matchedTitles =  _.flatten _.map(suggestion.occurrences, 'matchedTitles')
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > 12
