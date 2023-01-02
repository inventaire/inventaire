import dbFactory from '#db/couchdb/base'
import Patch from '#models/patch'
import { getEntityLastPatches } from './patches.js'

const designDocName = 'patches'
const db = dbFactory('patches', designDocName)

export default async params => {
  const { currentDoc, updatedDoc, userId } = params
  const newPatchDoc = Patch.create(params)

  if (entityHasPreviousVersions(currentDoc)) {
    const [ previousPatchDoc ] = await getEntityLastPatches(currentDoc._id)
    if (lastPatchWasFromSameUser(previousPatchDoc, userId)) {
      const aggregatedPatch = getAggregatedPatch(currentDoc, updatedDoc, previousPatchDoc)
      if (isNotSpecialPatch(previousPatchDoc)) {
        if (aggregatedPatchIsEmpty(aggregatedPatch)) {
          return deletePatch(previousPatchDoc)
        } else if (aggregatedPatchIsShorter(aggregatedPatch, previousPatchDoc, newPatchDoc)) {
          return updatePreviousPatch(aggregatedPatch, previousPatchDoc)
        }
      }
    }
  }

  return db.postAndReturn(newPatchDoc)
}

const entityHasPreviousVersions = currentDoc => currentDoc.version > 1

const lastPatchWasFromSameUser = (previousPatchDoc, userId) => {
  return previousPatchDoc && previousPatchDoc.user === userId
}

const getAggregatedPatch = (currentDoc, updatedDoc, previousPatchDoc) => {
  const beforeLastPatch = Patch.revert(currentDoc, previousPatchDoc)
  return Patch.getDiff(beforeLastPatch, updatedDoc)
}

const isNotSpecialPatch = patch => patch.context == null && patch.batch == null

const aggregatedPatchIsEmpty = patch => patch.length === 0

const aggregatedPatchIsShorter = (aggregatedPatch, previousPatchDoc, newPatchDoc) => {
  return aggregatedPatch.length < (previousPatchDoc.patch.length + newPatchDoc.patch.length)
}

const deletePatch = async patch => {
  await db.delete(patch._id, patch._rev)
}

const updatePreviousPatch = async (aggregatedPatch, previousPatchDoc) => {
  previousPatchDoc.patch = aggregatedPatch
  return db.putAndReturn(previousPatchDoc)
}
