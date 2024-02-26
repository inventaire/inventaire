import { firstDoc } from '#lib/couch'
import { notFoundError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { toLowerCase } from '#lib/utils/base'

export const byEmail = (db, email) => {
  assert_.string(email)
  return db.viewByKey('byEmail', email.toLowerCase())
}

export const byEmails = (db, emails) => {
  assert_.strings(emails)
  return db.viewByKeys('byEmail', emails.map(toLowerCase))
}

export const findOneByEmail = (db, email) => {
  return byEmail(db, email)
  .then(firstDoc)
  .then(user => {
    if (user) return user
    else throw notFoundError(email)
  })
}
