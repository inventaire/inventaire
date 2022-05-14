module.exports = {
  byEntities: {
    map: doc => {
      if (doc.uri != null) emit(doc.uri, null)
    }
  },
  byLists: {
    map: doc => {
      if (doc.uri != null) emit(doc.list, null)
    }
  },
}
