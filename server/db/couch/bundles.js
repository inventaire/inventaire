__ = require('config').universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
promises_ = __.require 'lib', 'promises'
assert_ = __.require 'utils', 'assert_types'

module.exports = (db, _)->
  actionAndReturn = (verb, doc)->
    assert_.object doc
    db[verb](doc)
    .then updateIdAndRev.bind(null, doc)

  bulkDelete = (docs)->
    assert_.objects docs
    if docs.length is 0 then return promises_.resolve []
    _.warn docs, 'bulkDelete'
    db.bulk couch_.setDocsDeletedTrue(docs)

  return bundles =
    postAndReturn: actionAndReturn.bind(null, 'post')
    putAndReturn: actionAndReturn.bind(null, 'put')
    bulkDelete: bulkDelete

updateIdAndRev = (doc, couchRes)->
  doc._id or= couchRes.id
  doc._rev = couchRes.rev
  return doc
