const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { attributes, validations, formatters } = __.require('models', 'group')
const { updatable } = attributes
const error_ = __.require('lib', 'error/error')
const radio = __.require('lib', 'radio')
const db = __.require('couch', 'base')('groups')
const { add: addSlug } = require('./slug')

module.exports = (data, userId) => {
  const { group: groupId, attribute } = data
  let { value } = data

  if (!updatable.includes(attribute)) {
    throw error_.new(`${attribute} can't be updated`, 400, data)
  }

  if (!validations[attribute](value)) {
    throw error_.newInvalid(attribute, value)
  }

  if (formatters[attribute]) value = formatters[attribute](value)

  return db.get(groupId)
  .then(groupDoc => {
    const notifData = getNotificationData(groupId, userId, groupDoc, attribute, value)

    groupDoc[attribute] = value

    return applyEditHooks(attribute, groupDoc)
    .then(({ updatedDoc, hooksUpdates }) => {
      return db.put(updatedDoc)
      .then(() => {
        radio.emit('group:update', notifData)
        return { hooksUpdates }
      })
    })
  })
}

const applyEditHooks = async (attribute, groupDoc) => {
  if (attribute === 'name') {
    return updateSlug(groupDoc)
  } else {
    return { updatedDoc: groupDoc, hooksUpdates: {} }
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
