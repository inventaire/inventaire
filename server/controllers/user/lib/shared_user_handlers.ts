import { firstDoc } from '#lib/couch'
import { notFoundError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { toLowerCase } from '#lib/utils/base'

export function byEmail (db, email) {
  assert_.string(email)
  return db.viewByKey('byEmail', email.toLowerCase())
}

export function byEmails (db, emails) {
  assert_.strings(emails)
  return db.viewByKeys('byEmail', emails.map(toLowerCase))
}

export function findOneByEmail (db, email) {
  return byEmail(db, email)
  .then(firstDoc)
  .then(user => {
    if (user) return user
    else throw notFoundError(email)
  })
}
