export default {
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
  byEntitiesType: {
    map: doc => {
      if (!doc.state) {
        emit(doc.entitiesType, null)
      }
    },
  },
}
