import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import { setDeletedTrue } from '#lib/couch'
import { emit, radio } from '#lib/radio'

const db = dbFactory('groups')

export default function () {
  radio.on('group:leave', deleteGroupIfEmpty)
}

const deleteGroupIfEmpty = (groupId, userId) => {
  return db.get(groupId)
  .then(group => {
    // An admin can't leave a group if there are still members
    // so, if there are no admins, there should be no members too
    if (group.admins.length === 0) {
      return db.update(groupId, setDeletedTrue)
      .then(_.Log('group deleted'))
      .then(() => emit('resource:destroyed', 'group', groupId))
    }
  })
  .catch(_.Error(`group deletion err: ${groupId}`))
}
