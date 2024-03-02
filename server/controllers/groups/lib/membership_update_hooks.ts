import dbFactory from '#db/couchdb/base'
import { setDeletedTrue } from '#lib/couch'
import { emit, radio } from '#lib/radio'
import { Log, logError } from '#lib/utils/logs'

const db = await dbFactory('groups')

export default function () {
  radio.on('group:leave', deleteGroupIfEmpty)
}

async function deleteGroupIfEmpty (groupId) {
  try {
    const group = await db.get(groupId)
    // An admin can't leave a group if there are still members
    // so, if there are no admins, there should be no members too
    if (group.admins.length === 0) {
      await db.update(groupId, setDeletedTrue).then(Log('group deleted'))
      await emit('resource:destroyed', 'group', groupId)
      if (group.picture) {
        await emit('image:needs:check', { url: group.picture, context: 'update' })
      }
    }
  } catch (err) {
    logError(`group deletion err: ${groupId}`)
  }
}
