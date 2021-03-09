const _ = require('builders/utils')
const radio = require('lib/radio')
const couch_ = require('lib/couch')
const db = require('db/couchdb/base')('groups')

module.exports = () => {
  radio.on('group:leave', deleteGroupIfEmpty)
}

const deleteGroupIfEmpty = (groupId, userId) => {
  return db.get(groupId)
  .then(group => {
    // An admin can't leave a group if there are still members
    // so, if there are no admins, there should be no members too
    if (group.admins.length === 0) {
      return db.update(groupId, couch_.setDeletedTrue)
      .then(_.Log('group deleted'))
      .then(() => radio.emit('resource:destroyed', 'group', groupId))
    }
  })
  .catch(_.Error(`group deletion err: ${groupId}`))
}
