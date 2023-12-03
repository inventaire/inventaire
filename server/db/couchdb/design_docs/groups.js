// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  byId: {
    map: doc => {
      emit(doc._id, null)
    },
  },
  bySlug: {
    map: doc => {
      emit(doc.slug, null)
    },
  },
  byRoleAndUser: {
    map: doc => {
      for (const role of [ 'admins', 'members', 'invited', 'requested', 'declined' ]) {
        for (const membership of doc[role]) {
          emit([ role, membership.user ], null)
        }
      }
    },
  },
  byName: {
    map: doc => {
      emit(doc.name.toLowerCase(), null)
    },
  },
  byPicture: {
    map: doc => {
      if (doc.picture !== null) {
        emit(doc.picture.split('/')[3], null)
      }
    },
  },
}
