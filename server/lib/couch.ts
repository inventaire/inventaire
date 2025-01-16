import { BasicUpdater } from '#lib/doc_updates'
import type { UnknownDocumentViewResponse } from '#types/couchdb'

export function mapDoc <R extends UnknownDocumentViewResponse> (res: R) {
  return res.rows.map(row => row.doc)
}

export function mapValue <R extends UnknownDocumentViewResponse> (res: R) {
  return res.rows.map(row => row.value)
}

export function ignoreNotFound (err) {
  if (!(err && err.statusCode === 404)) throw err
}

// See "The three ways to remove a document from CouchDB" http://n.exts.ch/2012/11/baleting
export const setDeletedTrue = BasicUpdater('_deleted', true)

export function setDocsDeletedTrue (docs) {
  return docs.map(setDeletedTrue)
}

export const minKey = null

// from http://docs.couchdb.org/en/latest/couchapp/views/collation.html
// > Beware that {} is no longer a suitable “high” key sentinel value.
//   Use a string like "\ufff0" instead.
export const maxKey = '\ufff0'
