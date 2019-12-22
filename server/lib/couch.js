const __ = require('config').universalPath
const { BasicUpdater } = __.require('lib', 'doc_updates')

const mapResult = (res, type) => res.rows.map(row => row[type])

const couch_ = module.exports = {
  mapDoc: res => mapResult(res, 'doc'),
  mapValue: res => res.rows.map(row => row.value),

  firstDoc: docs => docs != null ? docs[0] : null,

  joinOrderedIds: (idA, idB) => {
    if (idA < idB) return `${idA}:${idB}`
    else return `${idB}:${idA}`
  },

  ignoreNotFound: err => {
    if (!(err && err.statusCode === 404)) throw err
  },

  // See "The three ways to remove a document from CouchDB" http://n.exts.ch/2012/11/baleting
  setDeletedTrue: BasicUpdater('_deleted', true),

  setDocsDeletedTrue: docs => docs.map(couch_.setDeletedTrue),

  minKey: null,

  // from http://docs.couchdb.org/en/latest/couchapp/views/collation.html
  // > Beware that {} is no longer a suitable “high” key sentinel value.
  //   Use a string like "\ufff0" instead.
  maxKey: '\ufff0'
}
