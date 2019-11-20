
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const entities_ = require('./lib/entities')
const defaultLimit = 100

module.exports = (req, res) => {
  let { since } = req.query

  if (since != null) {
    if (_.isPositiveIntegerString(since)) {
      since = _.stringToInt(since)
    } else {
      return error_.bundleInvalid(req, res, 'since', since)
    }
  }

  return entities_.getLastChangedEntitiesUris(since, defaultLimit)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
