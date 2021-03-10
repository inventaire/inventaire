const __ = require('config').universalPath
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const reverseClaims = require('./lib/reverse_claims')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  property: {},
  value: { type: 'string' },
  refresh: {
    optional: true
  },
  sort: {
    generic: 'boolean',
    default: false
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(reverseClaims)
  .then(responses_.Wrap(res, 'uris'))
  .catch(error_.Handler(req, res))
}
