import { getTasksByEntitiesType } from '#controllers/tasks/lib/tasks'

const sanitization = {
  type: {
    allowlist: [ 'work' ],
  },
  limit: {
    default: 10,
  },
  offset: {
    default: 0,
  },
}

const controller = async params => {
  const tasks = await getTasksByEntitiesType(params)
  return { tasks }
}

export default { sanitization, controller }
