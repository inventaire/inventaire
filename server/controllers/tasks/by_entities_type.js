import { getTasksByEntitiesType } from '#controllers/tasks/lib/tasks'

const sanitization = {
  type: {
    allowlist: [ 'deduplicate' ],
  },
  'entities-type': {
    allowlist: [ 'work', 'human' ],
  },
  limit: {
    default: 10,
  },
  offset: {
    default: 0,
  },
}

// This endpoint should only return tasks created by a user,
// to return bot generated tasks, see endpoint 'byScore'

const controller = async params => {
  const tasks = await getTasksByEntitiesType(params)
  return { tasks }
}

export default { sanitization, controller }
