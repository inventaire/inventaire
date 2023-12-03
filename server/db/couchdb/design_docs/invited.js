// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  byId: {
    map: doc => {
      if (doc.type === 'invited') {
        emit(doc._id, null)
      }
    },
  },
  byEmail: {
    map: doc => {
      if (doc.type === 'invited') {
        emit(doc.email.toLowerCase(), null)
      }
    },
  },
}
