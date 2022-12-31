import dbFactory from 'db/couchdb/base'
const db = dbFactory('oauth_clients')

export default {
  byId: async id => {
    const doc = await db.get(id)
    doc.id = doc._id
    return doc
  },

  byIds: db.byIds
}
