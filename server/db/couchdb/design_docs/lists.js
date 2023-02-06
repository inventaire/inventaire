export default {
  byCreator: {
    map: doc => emit(doc.creator, null),
  },
}
