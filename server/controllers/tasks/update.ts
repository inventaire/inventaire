import { getTaskById, updateTasks } from '#controllers/tasks/lib/tasks'
import { log } from '#lib/utils/logs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import updateRelationScore from './lib/relation_score.js'

const sanitization = {
  id: {},
  attribute: {},
  value: {},
} as const

async function controller ({ id, attribute, value }: SanitizedParameters) {
  await updateTasks({
    ids: [ id ],
    attribute,
    newValue: value,
  })

  const task = await getTaskById(id)
  await updateRelationScore(task.suspectUri)
  log({ id, attribute, value, task }, 'task updated')

  return { ok: true }
}

export default {
  sanitization,
  controller,
  track: [ 'task', 'update' ],
}
