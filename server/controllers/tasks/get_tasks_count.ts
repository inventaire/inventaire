import { getTasksCount } from '#controllers/tasks/lib/tasks'

const sanitization = {} as const

async function controller () {
  const tasksCount = await getTasksCount()
  return { tasksCount }
}

export default { sanitization, controller }
