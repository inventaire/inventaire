CONFIG = require 'config'
__ = CONFIG.root
{ newsKey } = CONFIG.activitySummary
_ = __.require 'builders', 'utils'
{ oneDay } =  __.require 'lib', 'times'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
couch_ = __.require 'lib', 'couch'

module.exports = (db)->
  return summary_ =
    waitingForSummary: (periodicity, limit)->
      # pick users with last summary date between epoch 0 and periodicity*days ago
      onePeriodAgo = _.now() - periodicity*oneDay
      db.viewCustom 'waitingForSummary',
        include_docs: true
        limit: limit
        startkey: 0
        endkey: onePeriodAgo

    findOneWaitingForSummary: (periodicity)->
      summary_.waitingForSummary periodicity, 1
      .then couch_.firstDoc

    justReceivedActivitySummary: (id)->
      updater = BasicUpdater
        lastSummary: _.now()
        lastNews: newsKey

      db.update id, updater
