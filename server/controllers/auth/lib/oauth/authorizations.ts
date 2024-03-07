import { omit } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { assert_ } from '#lib/utils/assert_types'
import type { OAuthAuthorization } from '#types/oauth'

const db = await dbFactory('oauth_authorizations')
const idAttribute = 'authorizationCode'

export async function getAuthorizationById (id) {
  const doc = await db.get<OAuthAuthorization>(id)
  doc[idAttribute] = doc._id
  doc.expiresAt = new Date(doc.expiresAt)
  return doc
}

export async function saveAuthorization (code, userId, clientId) {
  assert_.object(code)
  assert_.string(userId)
  assert_.string(clientId)

  const idAttributeValue = code[idAttribute]
  const doc = omit(code, [ idAttribute ])
  doc._id = idAttributeValue
  doc.userId = userId
  doc.clientId = clientId
  await db.put(doc)
}

export const deleteAuthorization = async ({ _id, _rev }) => db.delete(_id, _rev)
