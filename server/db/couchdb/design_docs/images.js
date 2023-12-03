// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  bySourcesCount: {
    map: doc => {
      if (doc.sources != null) {
        emit(-doc.sources.length, null)
      }
    },
  },
}
