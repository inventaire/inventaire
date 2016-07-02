CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ attributes, tests } = __.require 'models', 'group'
{ updatable } = attributes
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
Radio = __.require 'lib', 'radio'

module.exports = (db)->
  updateSettings: (data, userId)->
    { group:groupId, attribute, value } = data

    unless attribute in updatable
      throw error_.new "#{attribute} can't be updated", 400, data

    unless tests[attribute](value)
      throw error_.new "invalid #{attribute}", 400, data

    db.get groupId
    .then (groupDoc)->
      notifData =
        usersToNotify: getUsersToNotify groupDoc
        groupId: groupId
        actorId: userId
        attribute: attribute
        newValue: value
        previousValue: groupDoc[attribute]

      db.update groupId, BasicUpdater(attribute, value)
      .then -> Radio.emit 'group:update', notifData

getUsersToNotify = (groupDoc)->
  _(groupDoc)
  .pick 'admins', 'members'
  .values()
  .flatten()
  .map _.property('user')
  .value()
