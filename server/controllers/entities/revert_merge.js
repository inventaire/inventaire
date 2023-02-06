import _ from '#builders/utils'
import { error_ } from '#lib/error/error'
import { emit } from '#lib/radio'
import revertMerge from './lib/revert_merge.js'

const sanitization = {
  from: {},
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

export default { sanitization, controller }
