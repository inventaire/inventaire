import dbFactory from '#db/couchdb/base'
import type { OAuthClient } from '#types/oauth'

const db = await dbFactory('oauth_clients')

export async function getOauthClientById (id) {
  const doc = await db.get<OAuthClient>(id)
  doc.id = doc._id
  return doc
}

export const getOauthClientsByIds = db.byIds
