import _ from '#builders/utils'
import { attributes, validations, formatters } from '#models/group'
import error_ from '#lib/error/error'
import radio from '#lib/radio'
import dbFactory from '#db/couchdb/base'
import { acceptNullValue } from '#models/attributes/group'
import { add as addSlug } from './slug.js'

const { updatable } = attributes
const db = dbFactory('groups')

export default async (data, userId) => {
  const { group: groupId, attribute } = data
  let { value } = data

  if (!updatable.includes(attribute)) {
    throw error_.new(`${attribute} can't be updated`, 400, data)
  }

  if (!validations[attribute](value) && !(value === null && acceptNullValue.includes(attribute))) {
    throw error_.newInvalid(attribute, value)
  }

  if (formatters[attribute]) value = formatters[attribute](value)

  const groupDoc = await db.get(groupId)
  const notifData = getNotificationData(groupId, userId, groupDoc, attribute, value)

  const currentValue = groupDoc[attribute]
  groupDoc[attribute] = value

  const { updatedDoc, hooksUpdates } = await applyEditHooks(attribute, groupDoc)

  await db.put(updatedDoc)

  await radio.emit('group:update', notifData)

  if (attribute === 'picture' && currentValue) {
    await radio.emit('image:needs:check', { url: currentValue, context: 'update' })
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
    hooksUpdates: _.pick(updatedDoc, 'slug')
  }
}

const getNotificationData = (groupId, userId, groupDoc, attribute, value) => ({
  usersToNotify: getUsersToNotify(groupDoc),
  groupId,
  actorId: userId,
  attribute,
  newValue: value,
  previousValue: groupDoc[attribute]
})

const getUsersToNotify = groupDoc => {
  return _(groupDoc)
  .pick('admins', 'members')
  .values()
  .flatten()
  .map('user')
  .value()
}
