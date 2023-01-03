import _ from '#builders/utils'
import { cache_ } from '#lib/cache'
import { error_ } from '#lib/error/error'
import { objectPromise } from '#lib/promises'
import { buildPopularityByUri } from './build_popularity_by_uri.js'

export async function getEntitiesPopularities ({ uris, refresh, dry }) {
  if (uris.length === 0) return {}
  const popularityPromises = {}
  for (const uri of uris) {
    popularityPromises[uri] = getEntityPopularity({ uri, refresh, dry })
  }
  return objectPromise(popularityPromises)
}

export const getEntityPopularity = ({ uri, refresh, dry }) => {
  if (!_.isEntityUri(uri)) throw error_.new('invalid uri', 400, uri)

  return cache_.get({
    key: `popularity:${uri}`,
    fn: buildPopularityByUri.bind(null, uri),
    refresh,
    dry,
    // Default to dryAndCache=true, when neither refresh or dry are set
    // as building a popularity score can take quite some time, and most consumers
    // just need a quick result
    dryAndCache: refresh !== true && dry !== true,
    dryFallbackValue: 0,
  })
}
