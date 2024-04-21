import { compact } from 'lodash-es'
import checkEntity from './lib/check_entity.js'

const sanitization = {
  uris: {},
}

async function controller ({ uris }) {
  const tasks = await Promise.all(uris.map(checkEntity))
  return { tasks: compact(tasks.flat()) }
}

export default { sanitization, controller }
