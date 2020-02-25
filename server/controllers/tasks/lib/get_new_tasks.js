const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const searchEntityDuplicatesSuggestions = require('./search_entity_duplicates_suggestions')
const addOccurrencesToSuggestion = require('./add_occurrences_to_suggestion')
const getAuthorWorksData = require('./get_author_works_data')
const evaluateSuggestions = require('./evaluate_suggestions')

module.exports = entity => existingTasks => {
  const { uri: suspectUri } = entity
  return Promise.all([
    searchEntityDuplicatesSuggestions(entity, existingTasks),
    getAuthorWorksData(entity._id)
  ])
  .then(([ newSuggestions, suspectWorksData ]) => {
    if (newSuggestions.length <= 0) return []
    const { labels: worksLabels } = suspectWorksData
    return Promise.all(newSuggestions.map(addOccurrencesToSuggestion(suspectWorksData)))
    .then(evaluateSuggestions(entity, worksLabels))
    .then(filterOutExistingTasks(existingTasks))
    .then(buildTaskObjects(suspectUri))
  })
}

const buildTaskObjects = suspectUri => suggestions => suggestions.map(suggestion => ({
  type: 'deduplicate',
  suspectUri,
  suggestionUri: suggestion.uri,
  lexicalScore: suggestion._score,
  externalSourcesOccurrences: suggestion.occurrences
}))

const filterOutExistingTasks = existingTasks => suggestions => {
  const existingTasksUris = _.map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => !existingTasksUris.includes(suggestion.uri))
}
