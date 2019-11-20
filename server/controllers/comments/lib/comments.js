
const CONFIG = require('config')
const __ = CONFIG.universalPath
const Comment = __.require('models', 'comment')
const assert_ = __.require('utils', 'assert_types')

const db = __.require('couch', 'base')('comments')

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
