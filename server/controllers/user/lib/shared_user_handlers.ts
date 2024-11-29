import { notFoundError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { toLowerCase } from '#lib/utils/base'
import type { CouchDoc, DbHandler } from '#types/couchdb'

export function byEmail <D extends CouchDoc> (db: DbHandler, email) {
  assert_.string(email)
  return db.getDocsByViewKey<D>('byEmail', email.toLowerCase())
}

export function byEmails <D extends CouchDoc> (db: DbHandler, emails) {
  assert_.strings(emails)
  return db.getDocsByViewKeys<D>('byEmail', emails.map(toLowerCase))
}

export async function findOneByEmail <D extends CouchDoc> (db: DbHandler, email) {
  const docs = await byEmail<D>(db, email)
  const user = docs[0]
  if (user) return user
  else throw notFoundError(email)
}
