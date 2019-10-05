__ = require('config').universalPath
_ = __.require 'builders', 'utils'
automerge = require './automerge'

module.exports = (suspect, workLabels)-> (suggestions)->
  # do not automerge if author name is in work title
  # as it confuses occurences finding on WP pages
  if authorNameInWorkTitles(suspect.labels, workLabels) then return suggestions
  sourcedSuggestions = findSourced suggestions
  if sourcedSuggestions.length is 0 then return suggestions
  if sourcedSuggestions.length > 1 then return sourcedSuggestions
  automerge(suspect.uri, sourcedSuggestions[0])

authorNameInWorkTitles = (authorLabels, workLabels)->
  for authorLabel in _.values(authorLabels)
    for workLabel in workLabels
      if workLabel.match(authorLabel)? then return true

findSourced = (suggestions)->
  suggestions.filter (sug)-> sug.occurrences.length > 0
