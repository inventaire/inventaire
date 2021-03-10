const Comment = require('models/comment')
const assert_ = require('lib/utils/assert_types')

const db = require('db/couchdb/base')('comments')

module.exports = {
  byId: db.get,

  byTransactionId: transactionId => {
    return db.viewByKey('byTransactionId', transactionId)
  },

  addTransactionComment: (userId, message, transactionId) => {
    assert_.strings([ userId, message, transactionId ])
    const comment = Comment.createTransactionComment(userId, message, transactionId)
    return db.post(comment)
  },

  update: (newMessage, comment) => {
    return db.update(comment._id, doc => {
      doc.message = newMessage
      doc.edited = Date.now()
      return doc
    })
  },

  delete: comment => {
    comment._deleted = true
    return db.put(comment)
  }
}
