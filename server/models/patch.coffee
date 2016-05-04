__ = require('config').universalPath
_ = __.require 'builders', 'utils'
jiff = require 'jiff'
tests = require './tests/common-tests'
{ versionned } = require './attributes/entity'

module.exports =
  create: (userId, currentDoc, updatedDoc)->
    tests.pass 'userId', userId
    _.type currentDoc, 'object'
    _.type updatedDoc, 'object'
    tests.pass 'couchUuid', updatedDoc._id

    # Use the updated doc _id as the the current doc
    # will miss an _id at creation.
    docId = updatedDoc._id
    # Take advantage of _rev to keep track of version numbers
    version = updatedDoc._rev.split('-')[0]

    return patch =
      _id: "#{docId}:#{version}"
      type: 'patch'
      user: userId
      timestamp: _.now()
      patch: getDiff currentDoc, updatedDoc

getDiff = (currentDoc, updatedDoc)->
  currentDoc = _.pick currentDoc, versionned
  updatedDoc = _.pick updatedDoc, versionned
  return jiff.diff currentDoc, updatedDoc
