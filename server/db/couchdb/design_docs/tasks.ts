import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Task } from '#types/task'

export const views: Views<Task> = {
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
      if (!doc.state) {
        emit([ doc.type, doc.entitiesType ], null)
      }
    },
  },
}
