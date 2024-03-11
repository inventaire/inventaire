import { emit } from '#db/couchdb/couchdb_views_context'

function double (num) { return num * 2 }

export const someDesignDocView = {
  byExample: {
    map: function (doc) {
      if (doc.example) emit(doc.example, 1)
    },
    reduce: function (keys, values) {
      return values.reduce((a, b) => a + b, 0)
    },
  },
  byExample2: {
    map: [
      double,
      function (doc) {
        if (doc.example) emit(doc.example, double(1))
      },
    ],
  },
  byExample3: {
    map: doc => {
      if (doc.example) emit(doc.example, 3)
    },
  },
}
