const tasks_ = require('./lib/tasks')

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

module.exports = { sanitization, controller }
