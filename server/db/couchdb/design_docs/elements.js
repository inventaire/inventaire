// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  byEntities: {
    map: doc => {
      if (doc.uri != null) emit(doc.uri, null)
    },
  },
  byListAndEntity: {
    map: doc => {
      emit([ doc.list, doc.uri ], null)
    },
  },
  byListings: {
    map: doc => {
      if (doc.uri != null) emit(doc.list, null)
    },
  },
}
