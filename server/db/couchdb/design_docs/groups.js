export default {
  byId: {
    map: doc => {
      if (doc.type === 'group') emit(doc._id, null)
    },
  },
  bySlug: {
    map: doc => {
      if (doc.type === 'group') emit(doc.slug, null)
    },
  },
  byUser: {
    map: doc => {
      if (doc.type === 'group') {
        for (const member of doc.members) {
          emit(member.user, null)
        }
        for (const admin of doc.admins) {
          emit(admin.user, null)
        }
      }
    },
  },
  byName: {
    map: doc => {
      if (doc.type === 'group') {
        emit(doc.name.toLowerCase(), null)
      }
    },
  },
  byInvitedUser: {
    map: doc => {
      if (doc.type === 'group') {
        for (const invitation of doc.invited) {
          emit(invitation.user, null)
        }
      }
    },
  },
  byPicture: {
    map: doc => {
      if (doc.type === 'group') {
        if (doc.picture !== null) {
          emit(doc.picture.split('/')[3], null)
        }
      }
    },
  },
}
