import { omit } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import assert_ from '#lib/utils/assert_types'

const db = dbFactory('oauth_tokens')
const idAttribute = 'accessToken'

export default {
  byId: async id => {
    const doc = await db.get(id)
    doc[idAttribute] = doc._id
    doc.accessTokenExpiresAt = new Date(doc.accessTokenExpiresAt)
    doc.refreshTokenExpiresAt = new Date(doc.refreshTokenExpiresAt)
    return doc
  },

  save: async (token, userId, clientId) => {
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
}
