import dbFactory from '#db/couchdb/base'
import User from '#models/user'

const db = dbFactory('users')

export const softDeleteById = userId => db.update(userId, User.softDelete)
