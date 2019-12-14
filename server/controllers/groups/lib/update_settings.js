const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { attributes, validations } = __.require('models', 'group')
const { updatable } = attributes
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const radio = __.require('lib', 'radio')
const db = __.require('couch', 'base')('groups')
const { add: addSlug } = require('./slug')

module.exports = (data, userId) => {
  const { group: groupId, attribute, value } = data

  if (!updatable.includes(attribute)) {
    throw error_.new(`${attribute} can't be updated`, 400, data)
  }

  if (!validations[attribute](value)) {
    throw error_.newInvalid(attribute, value)
  }

  return db.get(groupId)
  .then(groupDoc => {
    const notifData = getNotificationData(groupId, userId, groupDoc, attribute, value)

    groupDoc[attribute] = value

    return applyEditHooks(attribute, groupDoc)
    .then(({ updatedDoc, hooksUpdates }) => {
      return db.put(updatedDoc)
      .then(() => {
        radio.emit('group:update', notifData)
        hooksUpdates[attribute] = value
        return { update: hooksUpdates }
      })
    })
  })
}

const applyEditHooks = (attribute, groupDoc) => {
  if (attribute === 'name') {
    return updateSlug(groupDoc)
  } else {
    return promises_.resolve({ updatedDoc: groupDoc, hooksUpdates: {} })
  }
}

const updateSlug = groupDoc => {
  return addSlug(groupDoc)
  .then(updatedDoc => ({
    updatedDoc,
    hooksUpdates: _.pick(updatedDoc, 'slug')
  }))
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
