import { firstDoc } from '#lib/couch'
import { notFoundError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { toLowerCase } from '#lib/utils/base'
import type { DbHandler } from '#types/couchdb'

export function byEmail <D> (db: DbHandler, email) {
  assert_.string(email)
  return db.getDocsByViewKey<D>('byEmail', email.toLowerCase())
}

export function byEmails <D> (db: DbHandler, emails) {
  assert_.strings(emails)
  return db.getDocsByViewKeys<D>('byEmail', emails.map(toLowerCase))
}

export function findOneByEmail <D> (db: DbHandler, email) {
  return byEmail<D>(db, email)
  .then(firstDoc)
  .then(user => {
    if (user) return user
    else throw notFoundError(email)
  })
}
