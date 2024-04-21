import { getEntitiesPopularities } from './lib/popularity.js'

const sanitization = {
  uris: {},
  refresh: { optional: true },
}

async function controller ({ uris, refresh }) {
  const scores = await getEntitiesPopularities({ uris, refresh })
  return { scores }
}

export default { sanitization, controller }
