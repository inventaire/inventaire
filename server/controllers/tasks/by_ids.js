const tasks_ = require('./lib/tasks')

const sanitization = {
  ids: {}
}

const controller = async ({ ids }) => {
  const tasks = await tasks_.byIds(ids)
  return { tasks }
}

module.exports = { sanitization, controller }
