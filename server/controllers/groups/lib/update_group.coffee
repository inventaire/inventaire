CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Group = __.require 'models', 'group'
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
Radio = __.require 'lib', 'radio'
parse = __.require('lib', 'parsers')('group')

module.exports = (db)->
  return updateGroup = (data, userId)->
    { group:groupId, attribute, value } = data

    value = parse attribute, value

    unless attribute in Group.attributes.updatable
      throw error_.new "#{attribute} can't be updated", 400, data

    unless Group.tests[attribute](value)
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
