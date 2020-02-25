const __ = require('config').universalPath
const couch_ = __.require('lib', 'couch')
const assert_ = __.require('utils', 'assert_types')

module.exports = (db, _) => {
  const actionAndReturn = (verb, doc) => {
    assert_.object(doc)
    return db[verb](doc)
    .then(updateIdAndRev.bind(null, doc))
  }

  const bulkDelete = async docs => {
    assert_.objects(docs)
    if (docs.length === 0) return []
    _.warn(docs, 'bulkDelete')
    return db.bulk(couch_.setDocsDeletedTrue(docs))
  }

  return {
    postAndReturn: actionAndReturn.bind(null, 'post'),
    putAndReturn: actionAndReturn.bind(null, 'put'),
    bulkDelete
  }
}

const updateIdAndRev = (doc, couchRes) => {
  if (!doc._id) doc._id = couchRes.id
  doc._rev = couchRes.rev
  return doc
}
