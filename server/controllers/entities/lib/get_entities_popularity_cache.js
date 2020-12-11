const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const cache_ = __.require('lib', 'cache')
const buildPopularityByUri = require('./build_popularity_by_uri')

module.exports = async ({ uris, refresh, dry }) => {
  if (uris.length === 0) return {}
  const urisPopularity = _.indexAppliedValue(uris, getPopularity(refresh, dry))
  return promises_.props(urisPopularity)
}

const getPopularity = (refresh, dry) => uri => {
  if (!_.isEntityUri(uri)) throw error_.new('invalid uri', 400, uri)

  const params = {
    key: `popularity:${uri}`,
    fn: buildPopularityByUri.bind(null, uri),
    refresh,
    dryFallbackValue: 0
  }

  if (dry) {
    params.dry = true
  } else {
    params.dryAndCache = true
  }

  return cache_.get(params)
}
