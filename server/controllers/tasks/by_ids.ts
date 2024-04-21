import { getTasksByIds } from '#controllers/tasks/lib/tasks'

const sanitization = {
  ids: {},
}

async function controller ({ ids }) {
  const tasks = await getTasksByIds(ids)
  return { tasks }
}

export default { sanitization, controller }
