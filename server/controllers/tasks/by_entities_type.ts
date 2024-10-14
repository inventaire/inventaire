import { getTasksByEntitiesType } from '#controllers/tasks/lib/tasks'

const sanitization = {
  type: {
    allowlist: [ 'deduplicate' ],
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

async function controller (params) {
  const tasks = await getTasksByEntitiesType(params)
  return { tasks }
}

export default { sanitization, controller }
