import _ from '#builders/utils'
import checkEntity from './lib/check_entity.js'

const sanitization = {
  uris: {},
}

const controller = async ({ uris }) => {
  const tasks = await Promise.all(uris.map(checkEntity))
  return { tasks: _.compact(tasks.flat()) }
}

export default { sanitization, controller }
