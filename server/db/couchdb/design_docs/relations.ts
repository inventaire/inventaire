import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Relation } from '#types/relation'

export const views: Views<Relation> = {
  byStatus: {
    map: doc => {
      const [ a, b ] = doc._id.split(':')
      if (doc.status === 'friends') {
        emit([ a, 'friends' ], b)
        emit([ b, 'friends' ], a)
      }
      if (doc.status === 'a-requested') {
        emit([ a, 'userRequested' ], b)
        emit([ b, 'otherRequested' ], a)
      }
      if (doc.status === 'b-requested') {
        emit([ b, 'userRequested' ], a)
        emit([ a, 'otherRequested' ], b)
      }
    },
  },
}
