__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
jiff = require 'jiff'
tests = require './tests/common-tests'
{ versionned } = require './attributes/entity'

module.exports =
  create: (userId, currentDoc, updatedDoc)->
    tests.pass 'userId', userId
    _.type currentDoc, 'object'
    _.type updatedDoc, 'object'
    tests.pass 'couchUuid', updatedDoc._id

    if currentDoc is updatedDoc
      throw error_.new 'invalid update: same document objects', 500, arguments

    # Use the updated doc _id as the the current doc
    # will miss an _id at creation.
    docId = updatedDoc._id
    # Take advantage of _rev to keep track of version numbers
    version = updatedDoc._rev.split('-')[0]

    return patch =
      _id: "#{docId}:#{version}"
      type: 'patch'
      user: userId
      timestamp: Date.now()
      patch: getDiff currentDoc, updatedDoc

  getSnapshots: (base, patchDocs)->
    previousVersion = base
    for patchDoc in patchDocs
      # jiff.patch is non-mutating: we get a new object without modifying the previous snapshot
      previousVersion = patchDoc.snapshot = jiff.patch patchDoc.patch, previousVersion

    return patchDocs

getDiff = (currentDoc, updatedDoc)->
  currentDoc = _.pick currentDoc, versionned
  updatedDoc = _.pick updatedDoc, versionned
  patch = jiff.diff currentDoc, updatedDoc

  if patch.length is 0
    throw error_.new 'empty patch', 500, arguments

  return patch
