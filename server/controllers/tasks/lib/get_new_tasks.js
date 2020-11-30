const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const searchEntityDuplicatesSuggestions = require('./search_entity_duplicates_suggestions')
const addOccurrencesToSuggestion = require('./add_occurrences_to_suggestion')
const getAuthorWorksData = require('./get_author_works_data')
const automerge = require('./automerge')
const { getEntityNormalizedTerms } = __.require('controllers', 'entities/lib/terms_normalization')

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
    .then(filterNewTasks(existingTasks))
    .then(buildTasksObjects(suspectUri, 'deduplicate'))
  })
}

const evaluateSuggestions = (suspect, workLabels) => suggestions => {
  const suspectTerms = getEntityNormalizedTerms(suspect)
  // Do not automerge if author name is in work title
  // as it confuses occurences finding on WP pages
  if (authorNameInWorkTitles(suspectTerms, workLabels)) return suggestions
  const sourcedSuggestions = findSourced(suggestions)
  if (sourcedSuggestions.length === 0) return suggestions
  if (sourcedSuggestions.length > 1) return sourcedSuggestions
  return automerge(suspect.uri, sourcedSuggestions[0])
}

const filterNewTasks = existingTasks => suggestions => {
  const existingTasksUris = _.map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => !existingTasksUris.includes(suggestion.uri))
}

const buildTasksObjects = (suspectUri, type) => suggestions => suggestions.map(suggestion => {
  const { _score, uri: suggestionUri, occurrences } = suggestion
  const newTaskObject = { type, suspectUri, suggestionUri }
  if (_score) { newTaskObject.lexicalScore = _score }
  if (occurrences) { newTaskObject.externalSourcesOccurrences = occurrences }
  return newTaskObject
})

const authorNameInWorkTitles = (authorTerms, workLabels) => {
  for (const authorLabel of authorTerms) {
    for (const workLabel of workLabels) {
      return workLabel.match(authorLabel)
    }
  }
  return false
}

const findSourced = suggestions => suggestions.filter(sug => sug.occurrences.length > 0)
