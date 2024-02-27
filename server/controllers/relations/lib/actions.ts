import { emit } from '#lib/radio'
import { putFriendStatus, putNoneStatus, putRequestedStatus } from './queries.js'

export async function acceptRequest (userId, otherId) {
  const res = await putFriendStatus(userId, otherId)
  await emit('notify:friend:request:accepted', otherId, userId)
  return res
}

export async function simultaneousRequest (userId, otherId) {
  const res = await putFriendStatus(userId, otherId)
  await emit('notify:friend:request:accepted', otherId, userId)
  await emit('notify:friend:request:accepted', userId, otherId)
  return res
}

export const makeRequest = async (inviterId, recipientId, notify = true) => {
  const res = await putRequestedStatus(inviterId, recipientId)
  // Use notify=false to avoid emails when a new user is created with waiting
  // email invitations, which are then converted into requests
  if (notify) await emit('notify:friendship:request', recipientId, inviterId)
  return res
}

export const removeRelation = putNoneStatus
