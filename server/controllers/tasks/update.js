const tasks_ = require('controllers/tasks/lib/tasks')
const updateRelationScore = require('./lib/relation_score')

const sanitization = {
  id: {},
  attribute: {},
  value: {},
}

const controller = async ({ id, attribute, value }) => {
  await tasks_.update({
    ids: [ id ],
    attribute,
    newValue: value
  })

  const task = await tasks_.byId(id)
  await updateRelationScore(task.suspectUri)

  return { ok: true }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'task', 'update' ]
}
