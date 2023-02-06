export default {
  byEmail: {
    map: doc => {
      if (doc.type === 'user') {
        emit(doc.email.toLowerCase(), null)
      }
    },
  },
  byUsername: {
    map: doc => {
      if (doc.type === 'user' || doc.type === 'deletedUser' || doc.special) {
        const username = doc.username.toLowerCase()
        emit(username, null)
        if (doc.stableUsername != null) {
          const stableUsername = doc.stableUsername.toLowerCase()
          if (stableUsername !== username) emit(stableUsername, null)
        }
      }
    },
  },
  byCreation: {
    map: doc => {
      if (doc.type === 'user') {
        emit(doc.created, doc.username)
      }
    },
  },
  byPicture: {
    map: doc => {
      if (doc.type === 'user') {
        if (doc.picture != null) {
          emit(doc.picture.split('/')[3], null)
        }
      }
    },
  },
  nextSummary: {
    map: doc => {
      if (doc.type !== 'user') return
      if (doc.settings.notifications.global === false) return
      if (doc.settings.notifications.inventories_activity_summary === false) return
      if (doc.undeliveredEmail > 1) return

      const lastSummary = doc.lastSummary || doc.created
      const summaryPeriodicity = doc.summaryPeriodicity || 20
      const nextSummary = lastSummary + summaryPeriodicity * 24 * 3600 * 1000
      emit(nextSummary, null)
    },
  },
}
