import { getTaskById, updateTask } from '#controllers/tasks/lib/tasks'
import updateRelationScore from './lib/relation_score.js'

const sanitization = {
  id: {},
  attribute: {},
  value: {},
}

const controller = async ({ id, attribute, value }) => {
  await updateTask({
    ids: [ id ],
    attribute,
    newValue: value,
  })

  const task = await getTaskById(id)
  await updateRelationScore(task.suspectUri)

  return { ok: true }
}

export default {
  sanitization,
  controller,
  track: [ 'task', 'update' ],
}
