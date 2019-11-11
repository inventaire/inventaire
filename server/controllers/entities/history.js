// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// An endpoint to get entities history as snapshots and diffs
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const promises_ = __.require('lib', 'promises')
const entities_ = require('./lib/entities')
const patches_ = require('./lib/patches')

module.exports = function(req, res){
  const { id } = req.query

  if (!_.isInvEntityId(id)) {
    return error_.bundleInvalid(req, res, 'id', id)
  }

  return patches_.getSnapshots(id)
  .then(responses_.Wrap(res, 'patches'))
  .catch(error_.Handler(req, res))
}
