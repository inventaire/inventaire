const __ = require('config').universalPath
const db = __.require('couch', 'base')('oauth_clients')

module.exports = {
  byId: async id => {
    const doc = await db.get(id)
    doc.id = doc._id
    return doc
  }
}
