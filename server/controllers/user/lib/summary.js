const { newsKey } = require('config').activitySummary
const { BasicUpdater } = require('lib/doc_updates')
const couch_ = require('lib/couch')
const db = require('db/couchdb/base')('users')

const waitingForSummary = limit => {
  // Pick users with next summary between epoch 0 and now
  return db.viewCustom('nextSummary', {
    include_docs: true,
    limit,
    startkey: 0,
    endkey: Date.now()
  })
}

module.exports = {
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
