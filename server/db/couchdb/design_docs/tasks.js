export default {
  bySuspectUriAndType: {
    map: doc => {
      if (!doc.state) {
        emit([ doc.suspectUri, doc.type ], null)
      }
    },
  },
  bySuspectUriAndState: {
    map: doc => {
      emit([ doc.suspectUri, doc.state ], null)
    },
  },
  bySuggestionUriAndState: {
    map: doc => {
      emit([ doc.suggestionUri, doc.state ], null)
    },
  },
  byScore: {
    map: doc => {
      if (!doc.state) {
        const occurrencesCount = doc.externalSourcesOccurrences.length
        emit([ occurrencesCount, doc.relationScore, doc.lexicalScore ], null)
      }
    },
  },
  byTypeAndEntitiesType: {
    map: doc => {
      // filter reporter to not get bot generated tasks
      if (!doc.state && doc.reporter) {
        emit([ doc.type, doc.entitiesType ], null)
      }
    },
  },
}
