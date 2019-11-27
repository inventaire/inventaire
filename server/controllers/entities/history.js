// An endpoint to get entities history as snapshots and diffs
const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const patches_ = require('./lib/patches')
const sanitize = __.require('lib', 'sanitize/sanitize')

module.exports = (req, res) => {
  sanitize(req, res, { id: {} })
  .then(params => {
    const { id } = params
    return patches_.getSnapshots(id)
    .then(responses_.Wrap(res, 'patches'))
  })
  .catch(error_.Handler(req, res))
}
