const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const getEntitiesPopularityCache = require('./lib/get_entities_popularity_cache')

const sanitization = {
  uris: {},
  refresh: { optional: true }
}

// TODO: when passing a refresh flag, return the old popularity value
// instead of the default value, as getEntitiesPopularityCache would do
// for Wikidata entities
module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { uris, refresh } = params
    return getEntitiesPopularityCache(uris, refresh)
  })
  .then(responses_.Wrap(res, 'scores'))
  .catch(error_.Handler(req, res))
}
