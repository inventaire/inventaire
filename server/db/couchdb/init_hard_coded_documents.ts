import { isEqual } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { success } from '#lib/utils/logs'

const users = Object.values(hardCodedUsers)

const usersDb = await dbFactory('users')

export default function () {
  // Updating sequentially so that blue-cot initialize only a cookie session only once.
  // This seems to be required to avoid getting a 401 from CouchDB,
  // especially when CouchDB just started
  // Known case: when starting CouchDB and the server together with docker-compose
  function sequentialUpdate () {
    const nextUser = users.shift()
    if (nextUser == null) return

    return updateDoc(usersDb, nextUser)
    .then(sequentialUpdate)
  }

  return sequentialUpdate()
}

async function updateDoc (db, doc) {
  const { _id: id } = doc
  try {
    const currentDoc = await db.get(id)
    // Copy the _rev so that the doc have a chance to match
    // and, if not, so that we can use db.put
    const docPath = `${db.name}/${id}`
    doc._rev = currentDoc._rev
    if (!isEqual(currentDoc, doc)) {
      const res = await db.put(doc)
      success(res, `${docPath} updated`)
    }
  } catch (err) {
    // If the doc is missing, create it
    if (err.statusCode === 404) return db.put(doc)
    else throw err
  }
}
