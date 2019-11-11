CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ attributes, validations } = __.require 'models', 'group'
{ updatable } = attributes
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
radio = __.require 'lib', 'radio'

# Working around the circular dependency
groups_ = null
lateRequire = -> groups_ = require './groups'
setTimeout lateRequire, 0

module.exports = (data, userId)->
  { group:groupId, attribute, value } = data

  unless attribute in updatable
    throw error_.new "#{attribute} can't be updated", 400, data

  unless validations[attribute](value)
    throw error_.newInvalid attribute, value

  groups_.db.get groupId
  .then (groupDoc)->
    notifData = getNotificationData groupId, userId, groupDoc, attribute, value

    groupDoc[attribute] = value

    return applyEditHooks attribute, groupDoc
    .spread (updatedDoc, hooksUpdates)->
      groups_.db.put updatedDoc
      .then ->
        radio.emit 'group:update', notifData
        return { update: hooksUpdates }

applyEditHooks = (attribute, groupDoc)->
  if attribute isnt 'name' then return promises_.resolve [ groupDoc, {} ]

  groups_.addSlug groupDoc
  .then (updatedDoc)-> [ updatedDoc, _.pick(updatedDoc, 'slug') ]

getNotificationData = (groupId, userId, groupDoc, attribute, value)->
  usersToNotify: getUsersToNotify groupDoc
  groupId: groupId
  actorId: userId
  attribute: attribute
  newValue: value
  previousValue: groupDoc[attribute]

getUsersToNotify = (groupDoc)->
  _(groupDoc)
  .pick 'admins', 'members'
  .values()
  .flatten()
  .map _.property('user')
  .value()
