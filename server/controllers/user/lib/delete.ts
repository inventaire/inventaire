import dbFactory from '#db/couchdb/base'
import User from '#models/user'

const db = await dbFactory('users')

export const softDeleteById = userId => db.update(userId, User.softDelete)
