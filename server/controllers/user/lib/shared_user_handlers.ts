import { notFoundError } from '#lib/error/error'
import { assertStrings, assertString } from '#lib/utils/assert_types'
import { toLowerCase } from '#lib/utils/base'
import type { CouchDoc, DbHandler } from '#types/couchdb'

export function byEmail <D extends CouchDoc> (db: DbHandler, email) {
  assertString(email)
  return db.getDocsByViewKey<D>('byEmail', email.toLowerCase())
}

export function byEmails <D extends CouchDoc> (db: DbHandler, emails) {
  assertStrings(emails)
  return db.getDocsByViewKeys<D>('byEmail', emails.map(toLowerCase))
}

export async function findOneByEmail <D extends CouchDoc> (db: DbHandler, email) {
  const docs = await byEmail<D>(db, email)
  const user = docs[0]
  if (user) return user
  else throw notFoundError(email)
}
