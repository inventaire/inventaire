__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesList = __.require 'controllers', 'entities/lib/get_entities_list'

module.exports = (uri, suspectWorksLabels) ->
  getAuthorWorks { uri, dry: true }
  .then getSuggestionWorks
  .then (suggestionWorksData)->
    occurrences = []
    for sugWork in suggestionWorksData
      matchedTitles = getMatchingTitles suspectWorksLabels, _.values(sugWork.labels)
      if matchedTitles.length > 0
        { uri } = sugWork
        occurrences.push { uri, matchedTitles }
    return occurrences

getSuggestionWorks = (res)->
  uris = res.works.map _.property('uri')
  getEntitiesList uris

getMatchingTitles = (suspectWorksLabels, suggestionWorkLabels)->
  matchedTitles = []
  for sugWorkLabel in suggestionWorkLabels
    if sugWorkLabel in suspectWorksLabels
      matchedTitles.push sugWorkLabel
  return matchedTitles
