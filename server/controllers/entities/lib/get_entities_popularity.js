
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const cache_ = __.require('lib', 'cache')
const getPopularityByUri = require('./get_popularity_by_uri')

module.exports = (uris, refresh) => {
  if (uris.length === 0) return promises_.resolve({})
  const urisPopularity = _.indexAppliedValue(uris, getPopularity(refresh))
  return promises_.props(urisPopularity)
}

const getPopularity = refresh => uri => {
  if (!_.isEntityUri(uri)) throw error_.new('invalid uri', 400, uri)

  const key = `popularity:${uri}`
  const fn = getPopularityByUri.bind(null, uri)

  return cache_.get({ key, fn, refresh, dryAndCache: true, dryFallbackValue: 0 })
}
