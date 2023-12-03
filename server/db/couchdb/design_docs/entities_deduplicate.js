// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  findHumansHomonymes: {
    map: [
      function normalize (label) {
        return label
        .trim()
        .replace(/\s\w\.\s?/g, ' ')
        .replace(/\s\s/g, ' ')
        .toLowerCase()
      },
      function (doc) {
        if (doc.type !== 'entity' || doc.redirect != null) return

        // Keep only humans
        if (doc.claims == null || doc.claims['wdt:P31'] == null) return
        if (doc.claims['wdt:P31'][0] !== 'wd:Q5') return

        if (doc.labels != null && doc.claims != null) {
          const labelsSet = new Set(Object.values(doc.labels).map(normalize))
          labelsSet.forEach(label => emit(label, null))
        }
      },
    ],
    reduce: '_count',
  },
}
