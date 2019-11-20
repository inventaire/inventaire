const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const runQuery = require('./run_query')

module.exports = (req, res) => {
  const { query: queryName } = req.query

  if (!_.isNonEmptyString(queryName)) {
    return error_.bundleMissingQuery('query')
  }

  return runQuery(req.query)
  .then(responses_.Wrap(res, 'entities'))
  .catch(error_.Handler(req, res))
}
