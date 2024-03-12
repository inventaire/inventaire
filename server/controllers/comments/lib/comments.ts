import dbFactory from '#db/couchdb/base'
import { assert_ } from '#lib/utils/assert_types'
import { createTransactionComment } from '#models/comment'
import type { TransactionComment } from '#types/comment'

const db = await dbFactory('comments')

export default {
  byId: db.get<TransactionComment>,

  byTransactionId: transactionId => {
    return db.getDocsByViewKey<TransactionComment>('byTransactionId', transactionId)
  },

  addTransactionComment: (userId, message, transactionId) => {
    assert_.strings([ userId, message, transactionId ])
    const comment = createTransactionComment(userId, message, transactionId)
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
  },
}
