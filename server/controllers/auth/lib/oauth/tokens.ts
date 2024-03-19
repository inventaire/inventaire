import { omit } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { assert_ } from '#lib/utils/assert_types'
import type { OAuthToken } from '#types/oauth'

const db = await dbFactory('oauth_tokens')
const idAttribute = 'accessToken'

export async function getOauthTokenbyId (id) {
  const doc = await db.get<OAuthToken>(id)
  doc[idAttribute] = doc._id
  doc.accessTokenExpiresAt = new Date(doc.accessTokenExpiresAt)
  doc.refreshTokenExpiresAt = new Date(doc.refreshTokenExpiresAt)
  return doc
}

export async function saveOauthToken (token, userId, clientId) {
  assert_.object(token)
  assert_.string(userId)
  assert_.string(clientId)

  const idAttributeValue = token[idAttribute]
  const doc = omit(token, [ idAttribute ])
  doc._id = idAttributeValue
  doc.userId = userId
  doc.clientId = clientId
  await db.put(doc)
}
