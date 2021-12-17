module.exports = {
  byOwner: {
    map: doc => emit(doc.owner, null)
  }
}
