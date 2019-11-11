// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const cache_ = __.require('lib', 'cache')
const getPopularityByUri = require('./get_popularity_by_uri')

module.exports = function(uris, refresh){
  if (uris.length === 0) { return promises_.resolve({}) }
  const urisPopularity = _.indexAppliedValue(uris, getPopularity(refresh))
  return promises_.props(urisPopularity)
}

var getPopularity = refresh => (function(uri) {
  if (!_.isEntityUri(uri)) { throw error_.new('invalid uri', 400, uri) }

  const key = `popularity:${uri}`
  const fn = getPopularityByUri.bind(null, uri)

  return cache_.get({ key, fn, refresh, dryAndCache: true, dryFallbackValue: 0 })
})
