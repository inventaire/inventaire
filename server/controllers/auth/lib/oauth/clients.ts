import { omit } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import type { OAuthClient, OAuthClientId, SerializedOAuthClient } from '#types/oauth'

const db = await dbFactory('oauth_clients')

export async function getOauthClientById (id: OAuthClientId) {
  const doc = await db.get<OAuthClient>(id)
  return {
    id: doc._id,
    ...omit(doc, [ '_id' ]),
  } as SerializedOAuthClient
}

export const getOauthClientsByIds = db.byIds
