const CONFIG = require('config')
const __ = CONFIG.universalPath
const { newsKey } = CONFIG.activitySummary
const { BasicUpdater } = __.require('lib', 'doc_updates')
const couch_ = __.require('lib', 'couch')
const db = __.require('couch', 'base')('users')

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
  waitingForSummary,

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
