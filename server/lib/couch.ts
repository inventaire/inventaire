import { BasicUpdater } from '#lib/doc_updates'

const mapResult = (res, type) => res.rows.map(row => row[type])

export const mapDoc = res => mapResult(res, 'doc')
export const mapValue = res => res.rows.map(row => row.value)

export const firstDoc = docs => docs != null ? docs[0] : null

export function joinOrderedIds (idA, idB) {
  if (idA < idB) return `${idA}:${idB}`
  else return `${idB}:${idA}`
}

export function ignoreNotFound (err) {
  if (!(err && err.statusCode === 404)) throw err
}

// See "The three ways to remove a document from CouchDB" http://n.exts.ch/2012/11/baleting
export const setDeletedTrue = BasicUpdater('_deleted', true)

export const setDocsDeletedTrue = docs => docs.map(setDeletedTrue)

export const minKey = null

// from http://docs.couchdb.org/en/latest/couchapp/views/collation.html
// > Beware that {} is no longer a suitable “high” key sentinel value.
//   Use a string like "\ufff0" instead.
export const maxKey = '\ufff0'
