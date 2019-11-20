
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { attributes, validations } = __.require('models', 'group')
const { updatable } = attributes
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const radio = __.require('lib', 'radio')

// Working around the circular dependency
let groups_
const lateRequire = () => { groups_ = require('./groups') }
setTimeout(lateRequire, 0)

module.exports = (data, userId) => {
  const { group: groupId, attribute, value } = data

  if (!updatable.includes(attribute)) {
    throw error_.new(`${attribute} can't be updated`, 400, data)
  }

  if (!validations[attribute](value)) {
    throw error_.newInvalid(attribute, value)
  }

  return groups_.db.get(groupId)
  .then(groupDoc => {
    const notifData = getNotificationData(groupId, userId, groupDoc, attribute, value)

    groupDoc[attribute] = value

    return applyEditHooks(attribute, groupDoc)
    .spread((updatedDoc, hooksUpdates) => groups_.db.put(updatedDoc)
    .then(() => {
      radio.emit('group:update', notifData)
      return { update: hooksUpdates }
    }))
  })
}

const applyEditHooks = (attribute, groupDoc) => {
  if (attribute !== 'name') return promises_.resolve([ groupDoc, {} ])

  return groups_.addSlug(groupDoc)
  .then(updatedDoc => [ updatedDoc, _.pick(updatedDoc, 'slug') ])
}

const getNotificationData = (groupId, userId, groupDoc, attribute, value) => ({
  usersToNotify: getUsersToNotify(groupDoc),
  groupId,
  actorId: userId,
  attribute,
  newValue: value,
  previousValue: groupDoc[attribute]
})

const getUsersToNotify = groupDoc => _(groupDoc)
.pick('admins', 'members')
.values()
.flatten()
.map(_.property('user'))
.value()
