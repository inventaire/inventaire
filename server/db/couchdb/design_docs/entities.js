// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  byClaim: {
    map: doc => {
      if (doc.type === 'entity') {
        for (const property in doc.claims) {
          for (const value of doc.claims[property]) {
            emit([ property, value ], doc.claims['wdt:P31'][0])
          }
        }
      }
    },
  },
  byClaimValue: {
    map: doc => {
      if (doc.type === 'entity') {
        for (const property in doc.claims) {
          for (const value of doc.claims[property]) {
            emit(value, property)
          }
        }
      }
    },
  },
}
