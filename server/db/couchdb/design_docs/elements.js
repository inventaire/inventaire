module.exports = {
  byEntities: {
    map: doc => {
      if (doc.uri != null) emit(doc.uri, null)
    }
  },
  byListAndEntity: {
    map: doc => {
      emit([ doc.list, doc.uri ], null)
    }
  },
  byListings: {
    map: doc => {
      if (doc.uri != null) emit(doc.list, null)
    }
  },
}
