import tasks_ from './lib/tasks.js'

const sanitization = {
  ids: {}
}

const controller = async ({ ids }) => {
  const tasks = await tasks_.byIds(ids)
  return { tasks }
}

export default { sanitization, controller }
