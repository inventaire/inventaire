const tasks_ = require('./tasks')

module.exports = async ({ fromUri, toUri, entityType, userId }) => {
  const suggestion = {
    uri: toUri,
    reporter: userId,
  }
  const [ { id: taskId } ] = await tasks_.create(fromUri, 'deduplicate', entityType, [ suggestion ])
  return tasks_.byId(taskId)
}
