
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const revertMerge = require('./lib/revert_merge')
const radio = __.require('lib', 'radio')

module.exports = (req, res) => {
  const { body } = req
  const { from: fromUri } = body
  const { _id: reqUserId } = req.user

  if (!_.isNonEmptyString(fromUri)) {
    return error_.bundleMissingBody(req, res, 'from')
  }

  const [ fromPrefix, fromId ] = fromUri.split(':')

  if ((fromPrefix !== 'inv') || !_.isInvEntityId(fromId)) {
    return error_.bundleInvalid(req, res, 'from')
  }

  return revertMerge(reqUserId, fromId)
  .tap(() => radio.emit('entity:revert:merge', fromUri))
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
