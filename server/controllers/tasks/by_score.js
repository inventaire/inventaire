import tasks_ from './lib/tasks.js'

const sanitization = {
  limit: {
    default: 10
  },
  offset: {
    default: 0
  }
}

const controller = async params => {
  const tasks = await tasks_.byScore(params)
  return { tasks }
}

export default { sanitization, controller }
