// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const runQuery = require('./run_query')

module.exports = (req, res) => {
  const { query: queryName, refresh } = req.query

  if (!_.isNonEmptyString(queryName)) {
    return error_.bundleMissingQuery('query')
  }

  return runQuery(req.query)
  .then(responses_.Wrap(res, 'entities'))
  .catch(error_.Handler(req, res))
}
