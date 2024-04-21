import dbFactory from '#db/couchdb/base'
import { firstDoc } from '#lib/couch'
import config from '#server/config'
import type { User } from '#types/user'

const { newsKey } = config.activitySummary
const db = await dbFactory('users')

function waitingForSummary (limit) {
  // Pick users with next summary between epoch 0 and now
  return db.getDocsByViewQuery<User>('nextSummary', {
    include_docs: true,
    limit,
    startkey: 0,
    endkey: Date.now(),
  })
}

export function findOneWaitingForSummary () {
  return waitingForSummary(1)
  .then(firstDoc)
}

export function justReceivedActivitySummary (id) {
  return db.update(id, doc => {
    return Object.assign(doc, {
      lastSummary: Date.now(),
      lastNews: newsKey,
    })
  })
}
