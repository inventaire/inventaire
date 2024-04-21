import dbFactory from '#db/couchdb/base'
import { createPatchDoc, getPatchDiff, revertPatch } from '#models/patch'
import { getEntityLastPatches } from './patches.js'

const designDocName = 'patches'
const db = await dbFactory('patches', designDocName)

export default async function (params) {
  const { currentDoc, updatedDoc, userId } = params
  const newPatchDoc = createPatchDoc(params)

  if (entityHasPreviousVersions(currentDoc)) {
    const [ previousPatchDoc ] = await getEntityLastPatches(currentDoc._id)
    if (lastPatchWasFromSameUser(previousPatchDoc, userId)) {
      const aggregatedOperations = getAggregatedOperations(currentDoc, updatedDoc, previousPatchDoc)
      if (isNotSpecialPatch(previousPatchDoc)) {
        if (aggregatedOperationsAreEmpty(aggregatedOperations)) {
          return deletePatch(previousPatchDoc)
        } else if (aggregatedOperationsAreShorter(aggregatedOperations, previousPatchDoc, newPatchDoc)) {
          return updatePreviousPatch(aggregatedOperations, previousPatchDoc)
        }
      }
    }
  }

  return db.postAndReturn(newPatchDoc)
}

const entityHasPreviousVersions = currentDoc => currentDoc.version > 1

function lastPatchWasFromSameUser (previousPatchDoc, userId) {
  return previousPatchDoc && previousPatchDoc.user === userId
}

function getAggregatedOperations (currentDoc, updatedDoc, previousPatchDoc) {
  const beforeLastPatch = revertPatch(currentDoc, previousPatchDoc)
  return getPatchDiff(beforeLastPatch, updatedDoc)
}

const isNotSpecialPatch = patch => patch.context == null && patch.batch == null

const aggregatedOperationsAreEmpty = operations => operations.length === 0

function aggregatedOperationsAreShorter (aggregatedOperations, previousPatchDoc, newPatchDoc) {
  return aggregatedOperations.length < (previousPatchDoc.operations.length + newPatchDoc.operations.length)
}

async function deletePatch (patch) {
  await db.delete(patch._id, patch._rev)
}

async function updatePreviousPatch (aggregatedOperations, previousPatchDoc) {
  previousPatchDoc.operations = aggregatedOperations
  return db.putAndReturn(previousPatchDoc)
}
