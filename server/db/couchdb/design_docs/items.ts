import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Item } from '#types/item'

export const views: Views<Item> = {
  byOwner: {
    map: doc => {
      emit(doc.owner, null)
    },
  },
  byOwnerAndVisibilityKey: {
    map: doc => {
      emit([ doc.owner, 'private' ], null)
      for (const visibilityKey of doc.visibility) {
        emit([ doc.owner, visibilityKey ], null)
      }
    },
  },
  byOwnerAndVisibilityKeyWithoutShelf: {
    map: doc => {
      if (doc.shelves == null || doc.shelves.length === 0) {
        emit([ doc.owner, 'private' ], null)
        for (const visibilityKey of doc.visibility) {
          emit([ doc.owner, visibilityKey ], null)
        }
      }
    },
  },
  byShelfAndVisibilityKey: {
    map: doc => {
      if (doc.shelves != null) {
        for (const shelf of doc.shelves) {
          emit([ shelf, 'private' ], null)
          for (const visibilityKey of doc.visibility) {
            emit([ shelf, visibilityKey ], null)
          }
        }
      }
    },
  },
  publicByDate: {
    map: doc => {
      if (doc.visibility.includes('public')) {
        emit(doc.created, null)
      }
    },
  },
  publicByOwnerAndDate: {
    map: doc => {
      if (doc.visibility.includes('public')) {
        emit([ doc.owner, doc.created ], null)
      }
    },
  },
  publicByShelfAndDate: {
    map: doc => {
      if (doc.shelves != null) {
        const isPublic = doc.visibility.includes('public')
        for (const shelf of doc.shelves) {
          if (isPublic) {
            emit([ shelf, doc.created ], null)
          }
        }
      }
    },
  },
  byOwnerAndEntity: {
    map: doc => {
      emit([ doc.owner, doc.entity ], null)
    },
  },
  byEntity: {
    map: doc => {
      if (doc.entity != null) {
        emit(doc.entity, null)
      }
    },
  },
  byPreviousEntity: {
    map: doc => {
      if (doc.previousEntities != null) {
        for (const uri of doc.previousEntities) {
          emit(uri, null)
        }
      }
    },
  },
}
