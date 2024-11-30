import { compact } from 'lodash-es'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import checkHumanDuplicate from './lib/check_human_duplicate.js'

const sanitization = {
  uris: {},
}

async function controller ({ uris }: SanitizedParameters) {
  const tasks = await Promise.all(uris.map(checkHumanDuplicate))
  return { tasks: compact(tasks.flat()) }
}

export default { sanitization, controller }
