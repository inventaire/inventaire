module.exports = {
  byDate: {
    map: doc => {
      emit(doc.created, [ doc._id, doc.title ])
    }
  },
  byListing: {
    map: doc => {
      if (doc.listing != null) {
        emit([ doc.owner, doc.listing ], null)
      }
    }
  },
  byListingWithoutShelf: {
    map: doc => {
      if (doc.shelves == null || doc.shelves.length === 0) {
        emit([ doc.owner, doc.listing ], null)
      }
    }
  },
  publicByDate: {
    map: doc => {
      if (doc.listing === 'public') {
        emit(doc.created, null)
      }
    }
  },
  publicByOwnerAndDate: {
    map: doc => {
      if (doc.listing === 'public') {
        emit([ doc.owner, doc.created ], null)
      }
    }
  },
  publicByShelfAndDate: {
    map: doc => {
      if (doc.shelves != null) {
        for (const shelf of doc.shelves) {
          if (doc.listing === 'public') {
            emit([ shelf, doc.created ], null)
          }
        }
      }
    }
  },
  byOwnerAndEntityAndListing: {
    map: doc => {
      emit([ doc.owner, doc.entity, doc.listing ], null)
    }
  },
  byEntity: {
    map: doc => {
      if (doc.entity != null) {
        emit([ doc.entity, doc.listing ], null)
      }
    }
  },
  missingPicture: {
    map: doc => {
      if (doc.title != null) {
        if (doc.pictures.length === 0) {
          emit(doc.created, null)
        }
      }
    }
  },
  byPreviousEntity: {
    map: doc => {
      if (doc.previousEntity != null) {
        for (const uri of doc.previousEntity) {
          emit(uri, null)
        }
      }
    }
  },
  byShelvesAndListing: {
    map: doc => {
      if (doc.shelves != null) {
        for (const shelf of doc.shelves) {
          emit([ shelf, doc.listing ], null)
        }
      }
    }
  },
}