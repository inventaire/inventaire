export default {
  byId: {
    map: doc => {
      if (doc.type === 'invited') {
        emit(doc._id, null)
      }
    },
  },
  byEmail: {
    map: doc => {
      if (doc.type === 'invited') {
        emit(doc.email.toLowerCase(), null)
      }
    },
  },
}
