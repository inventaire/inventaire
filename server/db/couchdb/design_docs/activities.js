// @ts-nocheck
// CouchDB design docs can not be turned into TS files yet, as couch-init2 expects JS files

export default {
  byActorNameAndDate: {
    map: doc => emit([ doc.actor.name, doc.updated ], null),
    reduce: '_count',
  },
  followActivitiesByObject: {
    map: doc => {
      if (doc.type === 'Follow') emit(doc.object.name, null)
    },
  },
  byExternalId: {
    map: doc => {
      if (doc.externalId) emit(doc.externalId, null)
    },
  },
}
