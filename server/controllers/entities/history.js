// An endpoint to get entities history as snapshots and diffs
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const patches_ = require('./lib/patches')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  id: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { id } = params
    return patches_.getWithSnapshots(id)
  })
  .then(responses_.Wrap(res, 'patches'))
  .catch(error_.Handler(req, res))
}
