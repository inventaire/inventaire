
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const reverseClaims = require('./lib/reverse_claims')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  property: {},
  value: {},
  refresh: { optional: true },
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
