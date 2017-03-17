CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ attributes, tests } = __.require 'models', 'group'
{ updatable } = attributes
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
radio = __.require 'lib', 'radio'

module.exports = (db, groups_)->
  updateSettings = (data, userId)->
    { group:groupId, attribute, value } = data

    unless attribute in updatable
      throw error_.new "#{attribute} can't be updated", 400, data

    unless tests[attribute](value)
      throw error_.newInvalid attribute, value

    db.get groupId
    .then (groupDoc)->
      notifData = getNotificationData groupId, userId, groupDoc, attribute, value

      groupDoc[attribute] = value

      applyEditHooks attribute, groupDoc
      .then db.put
      .then -> radio.emit 'group:update', notifData

    applyEditHooks = (attribute, groupDoc)->
      if attribute is 'name' then groups_.addSlug groupDoc
      else promises_.resolve groupDoc

    return updateSettings

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
