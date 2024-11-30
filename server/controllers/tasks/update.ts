import { getTaskById, updateTasks } from '#controllers/tasks/lib/tasks'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import updateRelationScore from './lib/relation_score.js'

const sanitization = {
  id: {},
  attribute: {},
  value: {},
}

async function controller ({ id, attribute, value }: SanitizedParameters) {
  await updateTasks({
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
