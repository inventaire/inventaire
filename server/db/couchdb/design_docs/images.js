export default {
  bySourcesCount: {
    map: doc => {
      if (doc.sources != null) {
        emit(-doc.sources.length, null)
      }
    },
  },
}
