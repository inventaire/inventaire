import { map } from 'lodash-es'
import { bulkDeleteTasks, getTasksBySuggestionUri, getTasksBySuspectUri, getTasksBySuspectUriAndState, updateTask } from '#controllers/tasks/lib/tasks'
import { tap, mappedArrayPromise } from '#lib/promises'
import { radio } from '#lib/radio'
import checkHumanDuplicate from './lib/check_human_duplicate.js'

export function initTasksHooks () {
  radio.on('entity:merge', archiveObsoleteEntityUriTasks)
  radio.on('entity:remove', archiveObsoleteEntityUriTasks)
  radio.on('entity:revert:merge', revertArchive)
  radio.on('entity:recover', revertArchive)
  radio.on('wikidata:entity:redirect', deleteBySuggestionUriAndRecheckSuspects)
}

const archiveObsoleteEntityUriTasks = uri => {
  return getTasksBySuspectUri(uri)
  .then(archiveTasks)
}

const deleteBySuggestionUriAndRecheckSuspects = (previousSuggestionUri, newSuggestionUri) => {
  return getTasksBySuggestionUri(previousSuggestionUri)
  .then(tap(bulkDeleteTasks))
  // Re-check entities after having archived obsolete tasks so that relationScores
  // are updated once every doc is in place.
  // No need to do anything with the newSuggestionUri as checkHumanDuplicate should find it
  // if it is relevant
  .then(mappedArrayPromise(task => checkHumanDuplicate(task.suspectUri)))
}

const archiveTasks = tasks => {
  if (tasks.length === 0) return
  const ids = map(tasks, '_id')
  return updateTask({ ids, attribute: 'state', newValue: 'merged' })
}

const revertArchive = async uri => {
  const tasks = await getTasksBySuspectUriAndState(uri, 'merged')
  const ids = map(tasks, '_id')
  return updateTask({ ids, attribute: 'state', newValue: undefined })
}
