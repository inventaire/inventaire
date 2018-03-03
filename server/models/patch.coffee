__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
jiff = require 'jiff'
validations = require './validations/common'
{ versionned } = require './attributes/entity'

module.exports =
  create: (userId, currentDoc, updatedDoc)->
    validations.pass 'userId', userId
    _.type currentDoc, 'object'
    _.type updatedDoc, 'object'
    validations.pass 'couchUuid', updatedDoc._id

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
    docRevId = updatedDoc._rev.split('-')[0]

    return patch =
      _id: "#{docId}:#{docRevId}"
      type: 'patch'
      user: userId
      timestamp: Date.now()
      patch: getDiff currentDoc, updatedDoc

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
