__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesList = __.require 'controllers', 'entities/lib/get_entities_list'
{ getEntityNormalizedTerms } = __.require 'controllers', 'entities/lib/terms_normalization'

module.exports = (uri, suspectWorksLabels) ->
  getAuthorWorks { uri }
  .then getSuggestionWorks
  .then (suggestionWorksData)->
    occurrences = []
    for sugWork in suggestionWorksData
      sugWorkTerms = getEntityNormalizedTerms sugWork
      matchedTitles = _.intersection suspectWorksLabels, sugWorkTerms
      if matchedTitles.length > 0
        { uri } = sugWork
        occurrences.push { uri, matchedTitles, structuredDataSource: true }
    return occurrences

getSuggestionWorks = (res)->
  uris = res.works.map _.property('uri')
  getEntitiesList uris
