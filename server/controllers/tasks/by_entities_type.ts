import { getTasksByEntitiesType } from '#controllers/tasks/lib/tasks'

const sanitization = {
  type: {
    allowlist: [ 'deduplicate' ],
  },
  entitiesType: {
    allowlist: [ 'work' ],
  },
  limit: {
    default: 10,
  },
  offset: {
    default: 0,
  },
}

async function controller (params) {
  const tasks = await getTasksByEntitiesType(params)
  return { tasks }
}

export default { sanitization, controller }
