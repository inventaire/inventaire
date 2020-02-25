const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { tap } = __.require('lib', 'promises')
const tasks_ = __.require('controllers', 'tasks/lib/tasks')
const radio = __.require('lib', 'radio')
const checkEntity = require('./lib/check_entity')

module.exports = () => {
  radio.on('entity:merge', archiveObsoleteEntityUriTasks)
  radio.on('entity:remove', archiveObsoleteEntityUriTasks)
  radio.on('entity:revert:merge', revertArchive)
  radio.on('entity:recover', revertArchive)
  radio.on('wikidata:entity:redirect', deleteBySuggestionUriAndRecheckSuspects)
}

const archiveObsoleteEntityUriTasks = uri => {
  return tasks_.bySuspectUri(uri)
  .then(archiveTasks)
}

const deleteBySuggestionUriAndRecheckSuspects = (previousSuggestionUri, newSuggestionUri) => {
  return tasks_.bySuggestionUri(previousSuggestionUri)
  .then(tap(tasks_.bulkDelete))
  // Re-check entities after having archived obsolete tasks so that relationScores
  // are updated once every doc is in place.
  // No need to do anything with the newSuggestionUri as checkEntity should find it
  // if it is relevant
  .map(task => checkEntity(task.suspectUri))
}

const archiveTasks = tasks => {
  if (tasks.length === 0) return
  const ids = _.map(tasks, '_id')
  return tasks_.update({ ids, attribute: 'state', newValue: 'merged' })
}

const revertArchive = uri => {
  return tasks_.bySuspectUriAndState(uri, 'merged')
  .then(tasks => {
    const ids = _.map(tasks, '_id')
    return tasks_.update({ ids, attribute: 'state', newValue: undefined })
  })
}
