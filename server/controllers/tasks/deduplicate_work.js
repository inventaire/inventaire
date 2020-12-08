const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const deduplicateWork = require('./lib/deduplicate_work')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  uri: {},
  isbn: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { uri, isbn } = params
    return deduplicateWork(uri, isbn)
  })
  .then(_.flatten)
  .then(responses_.Wrap(res, 'tasks'))
  .catch(error_.Handler(req, res))
}
