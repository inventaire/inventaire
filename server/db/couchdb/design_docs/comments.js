module.exports = {
  byTransactionId: {
    map: doc => {
      if (doc.transaction != null) emit(doc.transaction, null)
    }
  }
}
