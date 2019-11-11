/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const { newsKey } = CONFIG.activitySummary;
const { oneDay } =  __.require('lib', 'times');
const { BasicUpdater } = __.require('lib', 'doc_updates');
const couch_ = __.require('lib', 'couch');

module.exports = function(db){
  let summary_;
  return summary_ = {
    waitingForSummary(limit){
      // pick users with next summary between epoch 0 and now
      return db.viewCustom('nextSummary', {
        include_docs: true,
        limit,
        startkey: 0,
        endkey: Date.now()
      }
      );
    },

    findOneWaitingForSummary() {
      return summary_.waitingForSummary(1)
      .then(couch_.firstDoc);
    },

    justReceivedActivitySummary(id){
      const updater = BasicUpdater({
        lastSummary: Date.now(),
        lastNews: newsKey
      });

      return db.update(id, updater);
    }
  };
};
