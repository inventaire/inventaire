import { dbFactory } from '#db/couchdb/base'
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

export async function findOneWaitingForSummary () {
  const docs = await waitingForSummary(1)
  return docs[0]
}

export function justReceivedActivitySummary (id) {
  return db.update(id, doc => {
    return Object.assign(doc, {
      lastSummary: Date.now(),
      lastNews: newsKey,
    })
  })
}
