const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const cache_ = __.require('lib', 'cache')
const buildPopularityByUri = require('./build_popularity_by_uri')

module.exports = async (uris, refresh, dry) => {
  if (uris.length === 0) return {}
  const urisPopularity = _.indexAppliedValue(uris, getPopularity(refresh, dry))
  return promises_.props(urisPopularity)
}

const getPopularity = (refresh, dry) => uri => {
  if (!_.isEntityUri(uri)) throw error_.new('invalid uri', 400, uri)

  const params = {}
  params.key = `popularity:${uri}`
  params.fn = buildPopularityByUri.bind(null, uri)
  params.refresh = refresh || false
  if (dry) {
    params.dry = true
  } else {
    params.dryAndCache = true
  }
  params.dryFallbackValue = 0
  return cache_.get(params)
}
