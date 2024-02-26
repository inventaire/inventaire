import CONFIG from 'config'
import dbFactory from '#db/couchdb/base'
import { firstDoc } from '#lib/couch'
import { BasicUpdater } from '#lib/doc_updates'

const { newsKey } = CONFIG.activitySummary
const db = await dbFactory('users')

const waitingForSummary = limit => {
  // Pick users with next summary between epoch 0 and now
  return db.viewCustom('nextSummary', {
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

export const justReceivedActivitySummary = id => {
  const updater = BasicUpdater({
    lastSummary: Date.now(),
    lastNews: newsKey,
  })

  return db.update(id, updater)
}
