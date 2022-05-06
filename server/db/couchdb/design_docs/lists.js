module.exports = {
  byUser: {
    map: doc => emit(doc.user, null)
  }
}
