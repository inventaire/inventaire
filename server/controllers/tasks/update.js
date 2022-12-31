import tasks_ from 'controllers/tasks/lib/tasks'
import updateRelationScore from './lib/relation_score'

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

export default {
  sanitization,
  controller,
  track: [ 'task', 'update' ]
}
