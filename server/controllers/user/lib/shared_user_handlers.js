const _ = require('builders/utils')
const couch_ = require('lib/couch')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')

const handlers = module.exports = {
  byEmail: (db, email) => {
    assert_.string(email)
    return db.viewByKey('byEmail', email.toLowerCase())
  },

  byEmails: (db, emails) => {
    assert_.strings(emails)
    return db.viewByKeys('byEmail', emails.map(_.toLowerCase))
  },

  findOneByEmail: (db, email) => {
    return handlers.byEmail(db, email)
    .then(couch_.firstDoc)
    .then(user => {
      if (user) return user
      else throw error_.notFound(email)
    })
  }
}
