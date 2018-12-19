__ = require('config').universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'

module.exports = (db, _)->
  actionAndReturn = (verb, doc)->
    _.assertType doc, 'object'
    db[verb](doc)
    .then updateIdAndRev.bind(null, doc)

  bulkDelete = (docs)->
    _.assertType docs, 'array'
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
