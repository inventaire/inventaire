const db = require('db/couchdb/base')('oauth_clients')

module.exports = {
  byId: async id => {
    const doc = await db.get(id)
    doc.id = doc._id
    return doc
  },

  byIds: db.byIds
}
