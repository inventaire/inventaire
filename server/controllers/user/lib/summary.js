import CONFIG from 'config'
import { BasicUpdater } from 'lib/doc_updates'
import couch_ from 'lib/couch'
import dbFactory from 'db/couchdb/base'
const { newsKey } = CONFIG.activitySummary
const db = dbFactory('users')

const waitingForSummary = limit => {
  // Pick users with next summary between epoch 0 and now
  return db.viewCustom('nextSummary', {
    include_docs: true,
    limit,
    startkey: 0,
    endkey: Date.now()
  })
}

export default {
  findOneWaitingForSummary: () => {
    return waitingForSummary(1)
    .then(couch_.firstDoc)
  },

  justReceivedActivitySummary: id => {
    const updater = BasicUpdater({
      lastSummary: Date.now(),
      lastNews: newsKey
    })

    return db.update(id, updater)
  }
}
