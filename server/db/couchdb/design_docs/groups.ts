import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Group } from '#types/group'

export const views: Views<Group> = {
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
