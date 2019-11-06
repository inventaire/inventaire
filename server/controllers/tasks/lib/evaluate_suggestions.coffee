__ = require('config').universalPath
_ = __.require 'builders', 'utils'
automerge = require './automerge'
getEntityNormalizedTerms = __.require 'controllers', 'entities/lib/get_entity_normalized_terms'

module.exports = (suspect, workLabels)-> (suggestions)->
  suspectTerms = getEntityNormalizedTerms suspect
  # Do not automerge if author name is in work title
  # as it confuses occurences finding on WP pages
  if authorNameInWorkTitles suspectTerms, workLabels then return suggestions
  sourcedSuggestions = findSourced suggestions
  if sourcedSuggestions.length is 0 then return suggestions
  if sourcedSuggestions.length > 1 then return sourcedSuggestions
  automerge(suspect.uri, sourcedSuggestions[0])

authorNameInWorkTitles = (authorTerms, workLabels)->
  for authorLabel in authorTerms
    for workLabel in workLabels
      if workLabel.match(authorLabel) then return true
  return false

findSourced = (suggestions)->
  suggestions.filter (sug)-> sug.occurrences.length > 0
