__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
jiff = require 'jiff'
validations = require './validations/common'
{ versionned } = require './attributes/entity'

module.exports =
  create: (params)->
    { userId, currentDoc, updatedDoc, context } = params
    validations.pass 'userId', userId
    _.assertType currentDoc, 'object'
    _.assertType updatedDoc, 'object'
    validations.pass 'couchUuid', updatedDoc._id

    if context? then _.assertType context, 'object'

    if currentDoc is updatedDoc
      throw error_.new 'invalid update: same document objects', 500, arguments

    # Use the updated doc _id as the the current doc
    # will miss an _id at creation.
    docId = updatedDoc._id

    # Take advantage of _rev to get a growing id identifying the order of patches
    # The first patch will have a version number of 2, as the empty template doc
    # would be version 1 but has no dedicated patch (its always the same template)
    # /!\ DO NOT expect to have exactly one patch per revision!
    # The entity document id being the entity URI base, actions might be taken
    # to recover a mistakenly deleted entity document: two actions that would not
    # produce patches and that have for consequence that the next patch docRevId
    # will be the last patch docRevID + 3
    docRevId = parseInt updatedDoc._rev.split('-')[0]

    patch =
      _id: "#{docId}:#{docRevId}"
      type: 'patch'
      user: userId
      timestamp: Date.now()
      patch: getDiff currentDoc, updatedDoc

    # Let the consumer pass any data object helping to contextualize the patch
    # Current uses:
    # - `{ mergeFrom: entityId }` where entityId is the entity being merged
    #   with the current entity. This is useful to be able to easily find
    #   the merge patch during a merge revert
    if context? then patch.context = context

    return patch

  # Reverts the effects of a patch on a entity doc
  revert: (currentDoc, patch)->
    inversePatch = jiff.inverse patch.patch
    _.inspect inversePatch, "inverse patch #{patch._id}"
    updatedDoc = applyInversePatch currentDoc, inversePatch
    return updatedDoc

  getSnapshots: (base, patchDocs)->
    previousVersion = base
    for patchDoc in patchDocs
      patchDoc.snapshot = jiff.patch patchDoc.patch, previousVersion
      # jiff.patch is non-mutating: we get a new object
      # without modifying the previous snapshot
      previousVersion = patchDoc.snapshot

    return patchDocs

getDiff = (currentDoc, updatedDoc)->
  currentDoc = _.pick currentDoc, versionned
  updatedDoc = _.pick updatedDoc, versionned
  patch = jiff.diff currentDoc, updatedDoc

  if patch.length is 0
    throw error_.new 'empty patch', 500, arguments

  return patch

applyInversePatch = (currentDoc, inversePatch)->
  currentDoc = _.cloneDeep currentDoc
  inversePatch.forEach fixOperation(currentDoc, inversePatch)

  updatedDoc = jiff.patch inversePatch, currentDoc

  # Cleanup: remove empty claims arrays
  for prop, array of updatedDoc.claims
    if array.length is 0 then delete updatedDoc.claims[prop]

  return updatedDoc

# Make the required modification for the jiff.patch to success
# to work around cases known to crash
fixOperation = (currentDoc, inversePatch)-> (op, index)->
  opFn = operationFix[op.op]
  if opFn? then opFn currentDoc, inversePatch, op, index

operationFix =
  add: (currentDoc, inversePatch, op, index)->
    { path, value } = op
    if _.isArray(value) and value.length is 1
      currentArray = getFromPatchPath currentDoc, path
      # Case when the 'add' operation tries to add an array with a value in it,
      # but this array as been re-created later on: the final result
      # should be an array with the current values + the added value.
      # The operation is thus converted into simply pushing the added value
      # at the end of the existing array
      if currentArray?
        op.value = value[0]
        op.path += "/#{currentArray.length}"

  test: (currentDoc, inversePatch, op, index)->
    { value } = op
    nextOp = inversePatch[index + 1]
    if nextOp.path is op.path and nextOp.op is 'remove'
      # Case when the 'remove' operation tries to remove an array with a value
      # in it, while this array might now contain more values
      if _.isArray(value) and value.length is 1
        op.value = value[0]
        op.path = nextOp.path = "#{op.path}/0"

      arrayPath = op.path.replace /\/\d+$/, ''
      patchedArray = getFromPatchPath currentDoc, arrayPath

      currentValueIndex = patchedArray.indexOf op.value
      # Update the operation path to the current value index
      # to avoid removing the wrong value if changes messed with the value index
      op.path = nextOp.path = op.path.replace /\/\d+$/, "/#{currentValueIndex}"

getFromPatchPath = (obj, path)->
  key = path.slice(1).replace(/\//g, '.')
  return _.get obj, key
