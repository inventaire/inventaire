import _ from 'builders/utils'
import error_ from 'lib/error/error'
import getEntityByUri from 'controllers/entities/lib/get_entity_by_uri'
import getEntitiesList from 'controllers/entities/lib/get_entities_list'
import tasks_ from './tasks'
import getEntitiesByIsbns from 'controllers/entities/lib/get_entities_by_isbns'
import mergeEntities from 'controllers/entities/lib/merge_entities'
import { haveExactMatch } from 'controllers/entities/lib/labels_match'

export default async (workUri, isbn, userId) => {
  const work = await getEntityByUri({ uri: workUri })
  if (work == null) throw error_.notFound({ workUri })

  const { type } = work
  if (type !== 'work') {
    throw error_.new(`unsupported type: ${type}, only work is supported`, 400, { workUri, work })
  }
  const editionsRes = await getEntitiesByIsbns([ isbn ])
  const edition = editionsRes.entities[0]
  const editionWorksUris = edition.claims['wdt:P629']
  if (_.isEqual(editionWorksUris, [ workUri ])) return

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
