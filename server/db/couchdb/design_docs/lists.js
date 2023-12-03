// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  byCreator: {
    map: doc => emit(doc.creator, null),
  },
}
