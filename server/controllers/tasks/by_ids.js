import { getTasksByIds } from '#controllers/tasks/lib/tasks'

const sanitization = {
  ids: {},
}

const controller = async ({ ids }) => {
  const tasks = await getTasksByIds(ids)
  return { tasks }
}

export default { sanitization, controller }
