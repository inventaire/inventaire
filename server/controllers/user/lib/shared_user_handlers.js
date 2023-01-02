import _ from '#builders/utils'
import couch_ from '#lib/couch'
import error_ from '#lib/error/error'
import assert_ from '#lib/utils/assert_types'

const handlers = {
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
export default handlers
