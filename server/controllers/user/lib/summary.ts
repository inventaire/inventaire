import CONFIG from 'config'
import dbFactory from '#db/couchdb/base'
import { firstDoc } from '#lib/couch'

const { newsKey } = CONFIG.activitySummary
const db = await dbFactory('users')

const waitingForSummary = limit => {
  // Pick users with next summary between epoch 0 and now
  return db.getDocsByViewQuery('nextSummary', {
    include_docs: true,
    limit,
    startkey: 0,
    endkey: Date.now(),
  })
}

export const findOneWaitingForSummary = () => {
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
