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
  byUser: {
    map: doc => {
      for (const member of doc.members) {
        emit(member.user, null)
      }
      for (const admin of doc.admins) {
        emit(admin.user, null)
      }
    },
  },
  byName: {
    map: doc => {
      emit(doc.name.toLowerCase(), null)
    },
  },
  byInvitedUser: {
    map: doc => {
      for (const invitation of doc.invited) {
        emit(invitation.user, null)
      }
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
