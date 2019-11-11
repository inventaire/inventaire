/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const Promise = require('bluebird')

module.exports = params => (function(ids) {
  ids = _.compact(ids)
  if (ids.length === 0) { throw new Error('no doc ids found') }

  const { db } = params
  const docUpdater = updateDoc(params)
  const updateByBatches = nextBatchUpdater(db, ids, docUpdater)
  return updateByBatches()
})

var nextBatchUpdater = function(db, ids, docUpdater){
  const subgroups = splitInSubgroups(ids)

  var updateNextBatch = function() {
    if (subgroups.length === 0) { return _.success('done updating !!') }

    const nextIdsBatch = subgroups.shift()
    _.log(nextIdsBatch.length, 'next bulk length')
    _.log(subgroups.length, 'remaining subgroups')

    const isLastBatch = subgroups.length === 0
    const interBulkDelay = isLastBatch ? 0 : 5000

    return db.fetch(nextIdsBatch)
    .map(docUpdater)
    // Remove docs that don't need an update
    .filter(_.identity)
    .then((docsToUpdate) => {
      if (docsToUpdate.length === 0) { return }
      return db.bulk(docsToUpdate)
      // Let CouchDB breath
      .delay(interBulkDelay)}).then(updateNextBatch)
  }

  return updateNextBatch
}

var updateDoc = function(params){
  const { updateFunction, log, showDiff, preview } = params
  const docDiff = showDiff ? require('./doc_diffs') : _.noop

  return doc => // updateFunction can return a promise, so we need to convert sync functions
  // to promises too, to keep it consistent
  // Use a clone of the doc to keep the doc itself unmutated
    Promise.try(() => updateFunction(_.cloneDeep(doc)))
  .then((updatedDoc) => {
    if (objDiff(doc, updatedDoc)) {
      docDiff(doc, updatedDoc, preview)
      if (!preview) { return updatedDoc }
    } else {
      log(doc._id, 'no changes')
      return
    }
  })
}

var splitInSubgroups = function(collection, groupsLength = 1000){
  const subgroups = []
  while (collection.length > 0) {
    subgroups.push(collection.splice(0, groupsLength))
  }

  return subgroups
}

var objDiff = function() { return !_.sameObjects.apply(null, arguments) }
