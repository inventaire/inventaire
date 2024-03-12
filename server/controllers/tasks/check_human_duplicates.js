import { compact } from 'lodash-es'
import checkHumanDuplicate from './lib/check_human_duplicate.js'

const sanitization = {
  uris: {},
}

const controller = async ({ uris }) => {
  const tasks = await Promise.all(uris.map(checkHumanDuplicate))
  return { tasks: compact(tasks.flat()) }
}

export default { sanitization, controller }
