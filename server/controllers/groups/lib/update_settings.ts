import { pick, without } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { emit } from '#lib/radio'
import { acceptNullValue, updatable } from '#models/attributes/group'
import { getAllGroupDocMembersIds, groupFormatters } from '#models/group'
import groupValidations from '#models/validations/group'
import type { Group, GroupId } from '#types/group'
import type { UserId } from '#types/user'
import { addSlug } from './slug.js'

const db = await dbFactory('groups')

export interface GroupSettingsUpdateParams {
  groupId: GroupId
  attribute: string
  value: unknown
}

export default async function (params: GroupSettingsUpdateParams, userId: UserId) {
  const { groupId, attribute } = params
  let { value } = params

  if (!updatable.includes(attribute)) {
    throw newError(`${attribute} can't be updated`, 400, { ...params })
  }

  if (!groupValidations[attribute](value) && !(value === null && acceptNullValue.includes(attribute))) {
    throw newInvalidError(attribute, value)
  }

  if (groupFormatters[attribute]) value = groupFormatters[attribute](value)

  const group = await db.get<Group>(groupId)
  const notifData = getNotificationData(groupId, userId, group, attribute, value)

  const currentValue = group[attribute]
  group[attribute] = value

  const { updatedDoc, hooksUpdates } = await applyEditHooks(attribute, group)

  await db.put(updatedDoc)

  await emit('group:update', notifData)

  if (attribute === 'picture' && currentValue) {
    await emit('image:needs:check', { url: currentValue, context: 'update' })
  }

  return { hooksUpdates }
}

async function applyEditHooks (attribute: string, group: Group) {
  if (attribute === 'name') {
    return updateSlug(group)
  } else {
    return { updatedDoc: group, hooksUpdates: {} }
  }
}

async function updateSlug (group) {
  const updatedDoc = await addSlug(group)
  return {
    updatedDoc,
    hooksUpdates: pick(updatedDoc, 'slug'),
  }
}

function getNotificationData (groupId: GroupId, userId: UserId, group: Group, attribute?: string, value?: unknown) {
  return {
    usersToNotify: getUsersToNotify(group, userId),
    groupId,
    actorId: userId,
    attribute,
    newValue: value,
    previousValue: group[attribute],
  }
}

function getUsersToNotify (group: Group, actorId: UserId) {
  const allUsersIds = getAllGroupDocMembersIds(group)
  return without(allUsersIds, actorId)
}
