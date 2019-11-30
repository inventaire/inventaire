const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const revertMerge = require('./lib/revert_merge')
const radio = __.require('lib', 'radio')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  from: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { from: fromUri, reqUserId } = params
    const [ fromPrefix, fromId ] = fromUri.split(':')

    if ((fromPrefix !== 'inv') || !_.isInvEntityId(fromId)) {
      const message = `invalid 'from' uri domain: ${fromPrefix}. Accepted domains: inv`
      return error_.bundle(req, res, message, 400, params)
    }

    return revertMerge(reqUserId, fromId)
    .tap(() => radio.emit('entity:revert:merge', fromUri))
    .then(responses_.Send(res))
  })
  .catch(error_.Handler(req, res))
}
