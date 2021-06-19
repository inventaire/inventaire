const _ = require('builders/utils')
const error_ = require('lib/error/error')
const revertMerge = require('./lib/revert_merge')
const { emit } = require('lib/radio')

const sanitization = {
  from: {}
}

const controller = async params => {
  const { from: fromUri, reqUserId } = params
  const [ fromPrefix, fromId ] = fromUri.split(':')

  if ((fromPrefix !== 'inv') || !_.isInvEntityId(fromId)) {
    const message = `invalid 'from' uri domain: ${fromPrefix}. Accepted domains: inv`
    throw error_.new(message, 400, params)
  }

  const result = await revertMerge(reqUserId, fromId)
  await emit('entity:revert:merge', fromUri)
  return result
}

module.exports = { sanitization, controller }
