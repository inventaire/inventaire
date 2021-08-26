const _ = require('builders/utils')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const jiff = require('jiff')
const validations = require('./validations/common')
const { versionned } = require('./attributes/entity')

module.exports = {
  create: params => {
    const { userId, currentDoc, updatedDoc, context, batchId } = params
    validations.pass('userId', userId)
    assert_.object(currentDoc)
    assert_.object(updatedDoc)
    validations.pass('couchUuid', updatedDoc._id)

    if (context != null) assert_.object(context)
    if (batchId != null) assert_.number(batchId)

    if (currentDoc === updatedDoc) {
      throw error_.new('invalid update: same document objects', 500, { currentDoc, updatedDoc })
    }

    const now = Date.now()

    // Use the updated doc _id as the the current doc
    // will miss an _id at creation.
    let { _id: entityId, version: entityVersion } = updatedDoc

    // If for some reason the entity document is malformed and lacks a version number,
    // fallback on using the timestamp, rather than crashing
    entityVersion = entityVersion || now

    const patch = {
      _id: `${entityId}:${entityVersion}`,
      type: 'patch',
      user: userId,
      timestamp: now,
      patch: getDiff(currentDoc, updatedDoc)
    }

    // Let the consumer pass any data object helping to contextualize the patch
    // Current uses:
    // - `{ mergeFrom: entityId }` where entityId is the entity being merged
    //   with the current entity. This is useful to be able to easily find
    //   the merge patch during a merge revert
    // - `{ redirectClaims: { fromUri } }` where fromUri is the entity that was merged
    //   in the patched entity, and from which claims that had it as value are being redirected
    // - `{ revertPatch: mergePatchId }` where mergePatchId is the patch where the merge
    //    being reverted was done
    if (context != null) patch.context = context
    if (batchId != null) patch.batch = batchId

    return patch
  },

  // Reverts the effects of a patch on a entity doc
  revert: (currentDoc, patch) => {
    const inversePatch = jiff.inverse(patch.patch)
    _.log(inversePatch, `inverse patch ${patch._id}`)
    const updatedDoc = applyInversePatch(currentDoc, inversePatch)
    return updatedDoc
  },

  addSnapshots: patchesDocs => {
    let previousVersion = { labels: {}, claims: {} }

    // patchesDocs is typically the output a CouchDB view
    // which is likely to order patches alphabetically (ex: 10 will come before 2)
    patchesDocs = patchesDocs.sort(byPatchId)

    for (const patchDoc of patchesDocs) {
      patchDoc.snapshot = jiff.patch(patchDoc.patch, previousVersion)
      // jiff.patch is non-mutating: we get a new object
      // without modifying the previous snapshot
      previousVersion = patchDoc.snapshot
    }

    return patchesDocs
  }
}

const getDiff = (currentDoc, updatedDoc) => {
  currentDoc = _.pick(currentDoc, versionned)
  updatedDoc = _.pick(updatedDoc, versionned)
  const patch = jiff.diff(currentDoc, updatedDoc)

  if (patch.length === 0) {
    throw error_.new('empty patch', 500, { currentDoc, updatedDoc })
  }

  return patch
}

const applyInversePatch = (currentDoc, inversePatch) => {
  currentDoc = _.cloneDeep(currentDoc)
  inversePatch.forEach(fixOperation(currentDoc, inversePatch))

  const updatedDoc = jiff.patch(inversePatch, currentDoc)

  // Cleanup: remove empty claims arrays
  for (const prop in updatedDoc.claims) {
    const array = updatedDoc.claims[prop]
    if (array.length === 0) { delete updatedDoc.claims[prop] }
  }

  return updatedDoc
}

// Make the required modification for the jiff.patch to success
// to work around cases known to crash
const fixOperation = (currentDoc, inversePatch) => (op, index) => {
  const opFn = operationFix[op.op]
  if (opFn != null) return opFn(currentDoc, inversePatch, op, index)
}

const operationFix = {
  add: (currentDoc, inversePatch, op, index) => {
    const { path, value } = op
    if (_.isArray(value) && (value.length === 1)) {
      const currentArray = getFromPatchPath(currentDoc, path)
      // Case when the 'add' operation tries to add an array with a value in it,
      // but this array as been re-created later on: the final result
      // should be an array with the current values + the added value.
      // The operation is thus converted into simply pushing the added value
      // at the end of the existing array
      if (currentArray != null) {
        op.value = value[0]
        op.path += `/${currentArray.length}`
      }
    }
  },

  test: (currentDoc, inversePatch, op, index) => {
    const { value } = op
    const nextOp = inversePatch[index + 1]
    if ((nextOp.path === op.path) && (nextOp.op === 'remove')) {
      // Case when the 'remove' operation tries to remove an array with a value
      // in it, while this array might now contain more values
      if (_.isArray(value) && (value.length === 1)) {
        op.value = value[0]
        op.path = (nextOp.path = `${op.path}/0`)
      }

      const arrayPath = op.path.replace(/\/\d+$/, '')
      const patchedArray = getFromPatchPath(currentDoc, arrayPath)

      const currentValueIndex = patchedArray.indexOf(op.value)
      // Update the operation path to the current value index
      // to avoid removing the wrong value if changes messed with the value index
      op.path = nextOp.path = op.path.replace(/\/\d+$/, `/${currentValueIndex}`)
    }
  }
}

const getFromPatchPath = (obj, path) => {
  const key = path.slice(1).replace(/\//g, '.')
  return _.get(obj, key)
}

const byPatchId = (patchA, patchB) => {
  const numIdA = parseInt(patchA._id.split(':')[1])
  const numIdB = parseInt(patchB._id.split(':')[1])
  return numIdA - numIdB
}
