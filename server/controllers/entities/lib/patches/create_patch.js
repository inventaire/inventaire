const designDocName = 'patches'
const db = require('db/couchdb/base')('patches', designDocName)
const Patch = require('models/patch')
const { getLastPatches } = require('./patches')

module.exports = async params => {
  const { currentDoc, updatedDoc, userId } = params
  const newPatch = Patch.create(params)
  if (currentDoc.version > 1) {
    const [ previousPatch ] = await getLastPatches(currentDoc._id)
    if (previousPatch && previousPatch.user === userId) {
      const beforeLastPatch = Patch.revert(currentDoc, previousPatch)
      const aggregatedPatch = Patch.getDiff(beforeLastPatch, updatedDoc)
      if (previousPatch.context == null && previousPatch.batch == null) {
        if (aggregatedPatch.length === 0) {
          await db.delete(previousPatch._id, previousPatch._rev)
          return
        } else if (aggregatedPatch.length < (previousPatch.patch.length + newPatch.patch.length)) {
          previousPatch.patch = aggregatedPatch
          return db.putAndReturn(previousPatch)
        }
      }
    }
  }
  return db.postAndReturn(newPatch)
}
