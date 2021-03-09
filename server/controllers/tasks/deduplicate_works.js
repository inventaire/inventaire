const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const deduplicateWork = require('./lib/deduplicate_works')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  uri: {},
  isbn: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { uri, isbn, reqUserId } = params
    return deduplicateWork(uri, isbn, reqUserId)
  })
  .then(_.flatten)
  .then(responses_.Wrap(res, 'tasks'))
  .catch(error_.Handler(req, res))
}
