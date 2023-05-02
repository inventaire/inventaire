import { addTaskContexts } from '#controllers/tasks/lib/add_task_contexts'
import { getTasksByIds } from '#controllers/tasks/lib/tasks'

const sanitization = {
  ids: {},
}

const controller = async ({ ids }) => {
  const tasks = await getTasksByIds(ids)
  await Promise.all(tasks.map(addTaskContexts))
  return { tasks }
}

export default { sanitization, controller }
