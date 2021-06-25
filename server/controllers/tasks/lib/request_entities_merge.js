const tasks_ = require('./tasks')

module.exports = async ({ fromUri, toUri, entityType, userId }) => {
  const task = await tasks_.bySuspectUriAndSuggestionUri(fromUri, toUri)
  if (task) return addReporter(task, userId)
  else return createTask({ fromUri, toUri, entityType, userId })
}

const addReporter = async (task, userId) => {
  task.reporters = task.reporters || []
  if (!task.reporters.includes(userId)) {
    await tasks_.update({
      ids: [ task._id ],
      attribute: 'reporters',
      newValue: task.reporters.concat([ userId ])
    })
  }
  return tasks_.byId(task._id)
}

const createTask = async ({ fromUri, toUri, entityType, userId }) => {
  const suggestion = {
    uri: toUri,
    reporters: [ userId ],
  }
  const [ { id: taskId } ] = await tasks_.create(fromUri, 'deduplicate', entityType, [ suggestion ])
  return tasks_.byId(taskId)
}
