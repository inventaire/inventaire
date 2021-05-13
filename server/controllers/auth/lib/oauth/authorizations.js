const db = require('db/couchdb/base')('oauth_authorizations')
const assert_ = require('lib/utils/assert_types')
const { omit } = require('lodash')
const idAttribute = 'authorizationCode'

module.exports = {
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
