const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const tasks_ = __.require('controllers', 'tasks/lib/tasks')
const radio = __.require('lib', 'radio')
const checkEntity = require('./lib/check_entity')

// TODO:
// - revert archiveObsoleteEntityUriTasks on revert-merge
module.exports = () => {
  radio.on('entity:merge', archiveObsoleteEntityUriTasks)
  radio.on('entity:remove', archiveObsoleteEntityUriTasks)
  return radio.on('wikidata:entity:redirect', deleteBySuggestionUriAndRecheckSuspects)
}

const archiveObsoleteEntityUriTasks = uri => tasks_.bySuspectUri(uri)
.then(archiveTasks)

const deleteBySuggestionUriAndRecheckSuspects = (previousSuggestionUri, newSuggestionUri) => tasks_.bySuggestionUri(previousSuggestionUri)
.tap(tasks_.bulkDelete)
// Re-check entities after having archived obsolete tasks so that relationScores
// are updated once every doc is in place.
// No need to do anything with the newSuggestionUri as checkEntity should find it
// if it is relevant
.map(task => checkEntity(task.suspectUri))

const archiveTasks = tasks => {
  if (tasks.length === 0) return
  const ids = _.map(tasks, '_id')
  return tasks_.update({ ids, attribute: 'state', newValue: 'merged' })
}
