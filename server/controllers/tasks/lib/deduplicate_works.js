const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const getEntitiesList = require('controllers/entities/lib/get_entities_list')
const tasks_ = require('./tasks')
const getEntitiesByIsbns = require('controllers/entities/lib/get_entities_by_isbns')
const mergeEntities = require('controllers/entities/lib/merge_entities')
const { haveExactMatch } = require('controllers/entities/lib/labels_match')

module.exports = async (workUri, isbn, userId) => {
  const work = await getEntityByUri({ uri: workUri })
  if (work == null) throw error_.notFound({ workUri })

  const { type } = work
  if (type !== 'work') {
    throw error_.new(`unsupported type: ${type}, only work is supported`, 400, { workUri, work })
  }
  const editionsRes = await getEntitiesByIsbns([ isbn ])
  const edition = editionsRes.entities[0]
  const editionWorksUris = edition.claims['wdt:P629']
  const editionWorks = await getEntitiesList(editionWorksUris)
  const suggestions = await getSuggestionsOrAutomerge(work, editionWorks, userId)

  if (suggestions.length === 0) return
  const existingTasks = await getExistingTasks(workUri)
  let newSuggestions = await filterNewTasks(existingTasks, suggestions)
  newSuggestions = _.map(newSuggestions, addToSuggestion(userId, isbn))
  return tasks_.create(workUri, 'deduplicate', work.type, newSuggestions)
}

const getSuggestionsOrAutomerge = async (work, editionWorks, userId) => {
  const workLabels = Object.values(work.labels)
  for (const editionWork of editionWorks) {
    const editionWorkLabels = Object.values(editionWork.labels)
    if (haveExactMatch(workLabels, editionWorkLabels)) {
      await mergeEntities({ userId, fromUri: work.uri, toUri: editionWork.uri })
      return [] // no suggestions
    }
  }
  return editionWorks
}

const getExistingTasks = uri => tasks_.bySuspectUris([ uri ])

const filterNewTasks = (existingTasks, suggestions) => {
  const existingTasksUris = _.map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => !existingTasksUris.includes(suggestion.uri))
}

const addToSuggestion = (userId, isbn) => suggestion => {
  suggestion.reporter = userId
  suggestion.clue = isbn
  return suggestion
}
