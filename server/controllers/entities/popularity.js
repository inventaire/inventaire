const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const sanitize = require('lib/sanitize/sanitize')
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
