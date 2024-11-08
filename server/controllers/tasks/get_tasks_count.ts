import { getTasksCount } from '#controllers/tasks/lib/tasks'

const sanitization = {}

async function controller () {
  const tasksCount = await getTasksCount()
  return { tasksCount }
}

export default { sanitization, controller }
