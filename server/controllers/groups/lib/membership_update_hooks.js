CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
couch_ = __.require 'lib', 'couch'

module.exports = (db)->
  deleteGroupIfEmpty = (groupId, userId)->
    db.get groupId
    .then (group)->
      # An admin can't leave a group if there are still members
      # so, if there are no admins, there should be no members too
      if group.admins.length is 0
        db.update groupId, couch_.setDeletedTrue
        .then _.Log('group deleted')
        .then -> radio.emit 'resource:destroyed', 'group', groupId

    .catch _.Error("group deletion err: #{groupId}")

  radio.on 'group:leave', deleteGroupIfEmpty
