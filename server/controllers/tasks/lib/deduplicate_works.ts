import { isEqual, map } from 'lodash-es'
import { getEntitiesByIsbns } from '#controllers/entities/lib/get_entities_by_isbns'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { haveExactMatch } from '#controllers/entities/lib/labels_match'
import mergeEntities from '#controllers/entities/lib/merge_entities'
import { createTasksFromSuggestions, getTasksBySuspectUris } from '#controllers/tasks/lib/tasks'
import { newError, notFoundError } from '#lib/error/error'
import type { EntityUri } from '#server/types/entity'

export default async function (workUri, isbn, userId) {
  const work = await getEntityByUri({ uri: workUri })
  if (work == null) throw notFoundError({ workUri })

  // Make sure workUri isn't a redirection
  workUri = work.uri

  const { type } = work
  if (type !== 'work') {
    throw newError(`unsupported type: ${type}, only work is supported`, 400, { workUri, work })
  }
  const editionsRes = await getEntitiesByIsbns([ isbn ])
  const edition = editionsRes.entities[0]
  const editionWorksUris = edition.claims['wdt:P629'] as EntityUri[]
  if (isEqual(editionWorksUris, [ workUri ])) return

  const editionWorks = await getEntitiesList(editionWorksUris)
  const suggestions = await getSuggestionsOrAutomerge(work, editionWorks, userId)

  if (suggestions.length === 0) return
  const existingTasks = await getExistingTasks(workUri)
  let newSuggestions = await filterNewTasks(existingTasks, suggestions)
  newSuggestions = map(newSuggestions, addToSuggestion(userId, isbn))
  return createTasksFromSuggestions({
    suspectUri: workUri,
    type: 'deduplicate',
    entitiesType: work.type,
    suggestions: newSuggestions,
  })
}

async function getSuggestionsOrAutomerge (work, editionWorks, userId) {
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

const getExistingTasks = uri => getTasksBySuspectUris([ uri ])

function filterNewTasks (existingTasks, suggestions) {
  const existingTasksUris = map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => !existingTasksUris.includes(suggestion.uri))
}

const addToSuggestion = (userId, isbn) => suggestion => {
  suggestion.reporter = userId
  suggestion.clue = isbn
  return suggestion
}
