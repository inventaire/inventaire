const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const cache_ = __.require('lib', 'cache')
const buildPopularityByUri = require('./build_popularity_by_uri')

const getEntitiesPopularities = async ({ uris, refresh, dry }) => {
  if (uris.length === 0) return {}
  const popularityPromises = {}
  for (const uri of uris) {
    popularityPromises[uri] = getEntityPopularity({ uri, refresh, dry })
  }
  return promises_.props(popularityPromises)
}

const getEntityPopularity = ({ uri, refresh, dry }) => {
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
    dryFallbackValue: 0
  })
}

module.exports = { getEntitiesPopularities, getEntityPopularity }
