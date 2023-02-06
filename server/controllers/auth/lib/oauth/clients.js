import dbFactory from '#db/couchdb/base'

const db = dbFactory('oauth_clients')

export const getOauthClientById = async id => {
  const doc = await db.get(id)
  doc.id = doc._id
  return doc
}

export const getOauthClientsByIds = db.byIds
