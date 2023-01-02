export default {
  byOwner: {
    map: doc => emit(doc.owner, null),
  },
}
