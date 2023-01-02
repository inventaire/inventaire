import tasks_ from './lib/tasks.js'

const sanitization = {
  type: {
    allowlist: [ 'work' ]
  },
  limit: {
    default: 10
  },
  offset: {
    default: 0
  }
}

const controller = async params => {
  const tasks = await tasks_.byEntitiesType(params)
  return { tasks }
}

export default { sanitization, controller }
