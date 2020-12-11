const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { getEntitiesPopularities } = require('./lib/popularity')

const sanitization = {
  uris: {},
  refresh: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(getEntitiesPopularities)
  .then(responses_.Wrap(res, 'scores'))
  .catch(error_.Handler(req, res))
}
