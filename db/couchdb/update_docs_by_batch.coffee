__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'

module.exports = (params)-> (ids)->
  { db } = params
  docUpdater = updateDoc params
  updateByBatches = nextBatchUpdater db, ids, docUpdater
  return updateByBatches()

nextBatchUpdater = (db, ids, docUpdater)->
  subgroups = splitInSubgroups ids

  updateNextBatch = ->
    if subgroups.length is 0 then return _.success 'done updating !!'

    nextIdsBatch = subgroups.shift()
    _.log nextIdsBatch.length, 'next bulk length'
    _.log subgroups.length, 'remaining subgroups'

    isLastBatch = subgroups.length is 0
    interBulkDelay = if isLastBatch then 0 else 5000

    db.fetch nextIdsBatch
    .map docUpdater
    # Remove docs that don't need an update
    .filter _.identity
    .then (docsToUpdate)->
      if docsToUpdate.length is 0 then return
      db.bulk docsToUpdate
      # Let CouchDB breath
      .delay interBulkDelay
    .then updateNextBatch

  return updateNextBatch

updateDoc = (params)->
  { updateFunction, log, showDiff, preview } = params
  docDiff = if showDiff then require('./doc_diffs') else _.noop

  return (doc)->
    # updateFunction can return a promise, so we need to convert sync functions
    # to promises too, to keep it consistent
    # Use a clone of the doc to keep the doc itself unmutated
    Promise.try -> updateFunction(_.cloneDeep(doc))
    .then (updatedDoc)->
      if objDiff doc, updatedDoc
        docDiff doc, updatedDoc, preview
        unless preview then return updatedDoc
      else
        log doc._id, 'no changes'
        return

splitInSubgroups = (collection, groupsLength = 1000)->
  subgroups = []
  while collection.length > 0
    subgroups.push collection.splice(0, groupsLength)

  return subgroups

objDiff = -> not _.sameObjects.apply(null, arguments)
