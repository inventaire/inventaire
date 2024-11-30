import { getTasksByIds } from '#controllers/tasks/lib/tasks'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  ids: {},
}

async function controller ({ ids }: SanitizedParameters) {
  const tasks = await getTasksByIds(ids)
  return { tasks }
}

export default { sanitization, controller }
