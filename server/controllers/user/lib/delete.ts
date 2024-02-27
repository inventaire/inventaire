import dbFactory from '#db/couchdb/base'
import { softDeleteUser } from '#models/user'

const db = await dbFactory('users')

export const softDeleteById = userId => db.update(userId, softDeleteUser)
