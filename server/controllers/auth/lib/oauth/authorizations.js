import dbFactory from 'db/couchdb/base'
import assert_ from 'lib/utils/assert_types'
import { omit } from 'lodash'
const db = dbFactory('oauth_authorizations')
const idAttribute = 'authorizationCode'

export default {
  byId: async id => {
    const doc = await db.get(id)
    doc[idAttribute] = doc._id
    doc.expiresAt = new Date(doc.expiresAt)
    return doc
  },

  save: async (code, userId, clientId) => {
    assert_.object(code)
    assert_.string(userId)
    assert_.string(clientId)

    const idAttributeValue = code[idAttribute]
    const doc = omit(code, [ idAttribute ])
    doc._id = idAttributeValue
    doc.userId = userId
    doc.clientId = clientId
    await db.put(doc)
  },

  delete: async ({ _id, _rev }) => db.delete(_id, _rev)
}
