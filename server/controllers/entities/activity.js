
// An endpoint to get statistics on users data contributions
// Reserved to admins for the moment, as some data might be considered privacy issue
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const patches_ = require('./lib/patches')

module.exports = (req, res) => {
  let { period } = req.query

  if (period != null) {
    if (!_.isPositiveIntegerString(period)) {
      return error_.bundleInvalid(req, res, 'period', period)
    }

    period = _.stringToInt(period)

    return patches_.getActivityFromLastDay(period)
    .then(responses_.Send(res))
    .catch(error_.Handler(req, res))
  } else {
    return patches_.getGlobalActivity()
    .then(responses_.Wrap(res, 'activity'))
    .catch(error_.Handler(req, res))
  }
}
