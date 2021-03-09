const _ = require('builders/utils')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const revertMerge = require('./lib/revert_merge')
const { tapEmit } = require('lib/radio')
const sanitize = require('lib/sanitize/sanitize')

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
    .then(tapEmit('entity:revert:merge', fromUri))
    .then(responses_.Send(res))
  })
  .catch(error_.Handler(req, res))
}
