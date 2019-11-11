// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const searchEntityDuplicatesSuggestions = require('./search_entity_duplicates_suggestions')
const addOccurrencesToSuggestion = require('./add_occurrences_to_suggestion')
const getAuthorWorksData = require('./get_author_works_data')
const evaluateSuggestions = require('./evaluate_suggestions')
const automerge = require('./automerge')
const mergeEntities = __.require('controllers', 'entities/lib/merge_entities')
const { _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler

module.exports = entity => (function(existingTasks) {
  const { uri:suspectUri } = entity
  return Promise.all([
    searchEntityDuplicatesSuggestions(entity, existingTasks),
    getAuthorWorksData(entity._id)
  ])
  .spread((newSuggestions, suspectWorksData) => {
    if (newSuggestions.length <= 0) return []
    const { labels:worksLabels } = suspectWorksData
    return Promise.all(newSuggestions.map(addOccurrencesToSuggestion(suspectWorksData)))
    .then(evaluateSuggestions(entity, worksLabels))
    .then(filterOutExistingTasks(existingTasks))
    .then(buildTaskObjects(suspectUri))
  })
})

var buildTaskObjects = suspectUri => suggestions => suggestions.map(suggestion => ({
  type: 'deduplicate',
  suspectUri,
  suggestionUri: suggestion.uri,
  lexicalScore: suggestion._score,
  externalSourcesOccurrences: suggestion.occurrences
}))

var filterOutExistingTasks = existingTasks => (function(suggestions) {
  const existingTasksUris = _.map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => !existingTasksUris.includes(suggestion.uri))
})
