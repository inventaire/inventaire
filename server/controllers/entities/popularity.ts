import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { getEntitiesPopularities } from './lib/popularity.js'

const sanitization = {
  uris: {},
  refresh: { optional: true },
} as const

async function controller ({ uris, refresh }: SanitizedParameters) {
  const scores = await getEntitiesPopularities({ uris, refresh })
  return { scores }
}

export default { sanitization, controller }
