import { getTasksByEntitiesType } from '#controllers/tasks/lib/tasks'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  type: {
    allowlist: [ 'deduplicate', 'merge', 'delete' ],
  },
  'entities-type': {
    allowlist: [ 'work', 'human', 'publisher', 'collection', 'edition', 'serie' ],
  },
  limit: {
    default: 1,
  },
  offset: {
    default: 0,
  },
}

// This endpoint should only return tasks created by a user,
// to return bot generated tasks, see endpoint 'byScore'

async function controller (params: SanitizedParameters) {
  const tasks = await getTasksByEntitiesType(params)
  return { tasks }
}

export default { sanitization, controller }
