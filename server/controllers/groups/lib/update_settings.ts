import { chain, pick } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { emit } from '#lib/radio'
import { acceptNullValue, updatable } from '#models/attributes/group'
import { groupFormatters } from '#models/group'
import groupValidations from '#models/validations/group'
import type { Group } from '#types/group'
import { addSlug } from './slug.js'

const db = await dbFactory('groups')

export default async function (data, userId) {
  const { group: groupId, attribute } = data
  let { value } = data

  if (!updatable.includes(attribute)) {
    throw newError(`${attribute} can't be updated`, 400, data)
  }

  if (!groupValidations[attribute](value) && !(value === null && acceptNullValue.includes(attribute))) {
    throw newInvalidError(attribute, value)
  }

  if (groupFormatters[attribute]) value = groupFormatters[attribute](value)

  const groupDoc = await db.get<Group>(groupId)
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

async function applyEditHooks (attribute, groupDoc) {
  if (attribute === 'name') {
    return updateSlug(groupDoc)
  } else {
    return { updatedDoc: groupDoc, hooksUpdates: {} }
  }
}

async function updateSlug (groupDoc) {
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

function getUsersToNotify (groupDoc) {
  return chain(groupDoc)
  .pick('admins', 'members')
  .values()
  .flatten()
  .map('user')
  .value()
}
