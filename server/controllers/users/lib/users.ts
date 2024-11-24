import { map } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import type { User } from '#types/user'

const db = await dbFactory('users')

export async function getUsersByCreationDate ({ limit = 100, offset = 0, withReportsOnly = false }) {
  const viewName = withReportsOnly ? 'byCreationWithReports' : 'byCreation'
  const { rows } = await db.view<User>('users', viewName, {
    include_docs: true,
    limit,
    skip: offset,
    startkey: [ Date.now() ],
    descending: true,
  })
  return map(rows, 'doc')
}
