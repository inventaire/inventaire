// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  byTransactionId: {
    map: doc => {
      if (doc.transaction != null) emit(doc.transaction, null)
    },
  },
}
