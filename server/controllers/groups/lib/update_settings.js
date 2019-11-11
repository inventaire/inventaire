// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { attributes, validations } = __.require('models', 'group')
const { updatable } = attributes
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const radio = __.require('lib', 'radio')

// Working around the circular dependency
let groups_ = null
const lateRequire = () => groups_ = require('./groups')
setTimeout(lateRequire, 0)

module.exports = function(data, userId){
  const { group:groupId, attribute, value } = data

  if (!updatable.includes(attribute)) {
    throw error_.new(`${attribute} can't be updated`, 400, data)
  }

  if (!validations[attribute](value)) {
    throw error_.newInvalid(attribute, value)
  }

  return groups_.db.get(groupId)
  .then((groupDoc) => {
    const notifData = getNotificationData(groupId, userId, groupDoc, attribute, value)

    groupDoc[attribute] = value

    return applyEditHooks(attribute, groupDoc)
    .spread((updatedDoc, hooksUpdates) => groups_.db.put(updatedDoc)
    .then(() => {
      radio.emit('group:update', notifData)
      return { update: hooksUpdates }}))})
}

var applyEditHooks = function(attribute, groupDoc){
  if (attribute !== 'name') { return promises_.resolve([ groupDoc, {} ]) }

  return groups_.addSlug(groupDoc)
  .then(updatedDoc => [ updatedDoc, _.pick(updatedDoc, 'slug') ])
}

var getNotificationData = (groupId, userId, groupDoc, attribute, value) => ({
  usersToNotify: getUsersToNotify(groupDoc),
  groupId,
  actorId: userId,
  attribute,
  newValue: value,
  previousValue: groupDoc[attribute]
})

var getUsersToNotify = groupDoc => _(groupDoc)
.pick('admins', 'members')
.values()
.flatten()
.map(_.property('user'))
.value()
