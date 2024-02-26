import { chain, pick } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { emit } from '#lib/radio'
import { acceptNullValue, updatable } from '#models/attributes/group'
import Group from '#models/group'
import { addSlug } from './slug.js'

const { validations, formatters } = Group
const db = await dbFactory('groups')

export default async (data, userId) => {
  const { group: groupId, attribute } = data
  let { value } = data

  if (!updatable.includes(attribute)) {
    throw newError(`${attribute} can't be updated`, 400, data)
  }

  if (!validations[attribute](value) && !(value === null && acceptNullValue.includes(attribute))) {
    throw newInvalidError(attribute, value)
  }

  if (formatters[attribute]) value = formatters[attribute](value)

  const groupDoc = await db.get(groupId)
  const notifData = getNotificationData(groupId, userId, groupDoc, attribute, value)

  const currentValue = groupDoc[attribute]
  groupDoc[attribute] = value

  const { updatedDoc, hooksUpdates } = await applyEditHooks(attribute, groupDoc)

  await db.put(updatedDoc)

  await emit('group:update', notifData)

  if (attribute === 'picture' && currentValue) {
    await emit('image:needs:check', { url: currentValue, context: 'update' })
  }

  return { hooksUpdates }
}

const applyEditHooks = async (attribute, groupDoc) => {
  if (attribute === 'name') {
    return updateSlug(groupDoc)
  } else {
    return { updatedDoc: groupDoc, hooksUpdates: {} }
  }
}

const updateSlug = async groupDoc => {
  const updatedDoc = await addSlug(groupDoc)
  return {
    updatedDoc,
    hooksUpdates: pick(updatedDoc, 'slug'),
  }
}

const getNotificationData = (groupId, userId, groupDoc, attribute, value) => ({
  usersToNotify: getUsersToNotify(groupDoc),
  groupId,
  actorId: userId,
  attribute,
  newValue: value,
  previousValue: groupDoc[attribute],
})

const getUsersToNotify = groupDoc => {
  return chain(groupDoc)
  .pick('admins', 'members')
  .values()
  .flatten()
  .map('user')
  .value()
}
