import { map } from 'lodash-es'
import dbFactory from '#db/couchdb/base'

const db = await dbFactory('users')

export async function getUsersByCreationDate ({ limit = 100, offset = 0 }) {
  const { rows } = await db.view('users', 'byCreation', {
    include_docs: true,
    limit,
    skip: offset,
    startkey: [ Date.now() ],
    descending: true,
  })
  return map(rows, 'doc')
}
