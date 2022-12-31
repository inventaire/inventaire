import { getEntitiesPopularities } from './lib/popularity'

const sanitization = {
  uris: {},
  refresh: { optional: true }
}

const controller = async params => {
  const scores = await getEntitiesPopularities(params)
  return { scores }
}

export default { sanitization, controller }
