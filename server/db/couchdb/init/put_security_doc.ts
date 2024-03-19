import fetch from 'node-fetch'
import { couchdbError } from './couchdb_error.js'

export async function putSecurityDoc (dbUrl, dbName) {
  const username = parseUsername(dbUrl)
  const url = `${dbUrl}/_security`
  const body = await fetch(url).then(res => res.json())
  if (body.admins == null) {
    const res = await fetch(url, {
      method: 'PUT',
      body: securityDoc(username),
    })

    if (res.status >= 400) {
      throw (await couchdbError(res, { dbUrl, dbName }))
    }

    return { created: true }
  } else {
    return { created: false }
  }
}

// from 'http://username:password@localhost:5984'
// to 'username'
const parseUsername = dbUrl => dbUrl.split('://')[1].split(':')[0]

const securityDoc = username => {
  if (!username || username.length === 0) {
    throw new Error('could not find username from db url')
  }

  return JSON.stringify({
    // Database admins can update design documents
    // and edit the admin and member lists.
    admins: { names: [ username ] },
    // Database members can access the database.
    // If no members are defined, the database is public.
    // Thus we just copy the admin there too to limit database access
    members: { names: [ username ] },
  })
}
