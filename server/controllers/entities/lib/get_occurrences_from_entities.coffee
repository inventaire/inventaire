__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesList = __.require 'controllers', 'entities/lib/get_entities_list'
getEntityNormalizedTerms = __.require 'controllers', 'entities/lib/get_entity_normalized_terms'

module.exports = (uri, suspectWorksLabels) ->
  getAuthorWorks { uri, dry: true }
  .then getSuggestionWorks
  .then (suggestionWorksData)->
    occurrences = []
    for sugWork in suggestionWorksData
      sugWorkTerms = getEntityNormalizedTerms sugWork
      matchedTitles = _.intersection suspectWorksLabels, sugWorkTerms
      if matchedTitles.length > 0
        { uri } = sugWork
        occurrences.push { uri, matchedTitles }
    return occurrences

getSuggestionWorks = (res)->
  uris = res.works.map _.property('uri')
  getEntitiesList uris
