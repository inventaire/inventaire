const _ = require('builders/utils')
const { attributes, validations, formatters } = require('models/group')
const { updatable } = attributes
const error_ = require('lib/error/error')
const radio = require('lib/radio')
const db = require('db/couchdb/base')('groups')
const { add: addSlug } = require('./slug')

module.exports = async (data, userId) => {
  const { group: groupId, attribute } = data
  let { value } = data

  if (!updatable.includes(attribute)) {
    throw error_.new(`${attribute} can't be updated`, 400, data)
  }

  if (!validations[attribute](value)) {
    throw error_.newInvalid(attribute, value)
  }

  if (formatters[attribute]) value = formatters[attribute](value)

  const groupDoc = await db.get(groupId)
  const notifData = getNotificationData(groupId, userId, groupDoc, attribute, value)

  groupDoc[attribute] = value

  const { updatedDoc, hooksUpdates } = await applyEditHooks(attribute, groupDoc)

  await db.put(updatedDoc)

  await radio.emit('group:update', notifData)

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
  .map(_.property('user'))
  .value()
}
