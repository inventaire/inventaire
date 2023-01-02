export default {
  byDate: {
    map: doc => {
      emit(doc.created, [ doc._id, doc.title ])
    },
  },
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
  missingPicture: {
    map: doc => {
      if (doc.title != null) {
        if (doc.pictures.length === 0) {
          emit(doc.created, null)
        }
      }
    },
  },
  byPreviousEntity: {
    map: doc => {
      if (doc.previousEntity != null) {
        for (const uri of doc.previousEntity) {
          emit(uri, null)
        }
      }
    },
  },
}
