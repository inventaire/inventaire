CONFIG = require 'config'
__ = CONFIG.universalPath
{ newsKey } = CONFIG.activitySummary
{ oneDay } =  __.require 'lib', 'times'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
couch_ = __.require 'lib', 'couch'

module.exports = (db)->
  return summary_ =
    waitingForSummary: (limit)->
      # pick users with next summary between epoch 0 and now
      db.viewCustom 'nextSummary',
        include_docs: true
        limit: limit
        startkey: 0
        endkey: Date.now()

    findOneWaitingForSummary: ->
      summary_.waitingForSummary 1
      .then couch_.firstDoc

    justReceivedActivitySummary: (id)->
      updater = BasicUpdater
        lastSummary: Date.now()
        lastNews: newsKey

      db.update id, updater
