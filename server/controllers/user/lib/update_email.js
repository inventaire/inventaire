import { sendValidationEmail } from '#controllers/user/lib/token'
import dbFactory from '#db/couchdb/base'
import User from '#models/user'

const db = await dbFactory('users')

export default async function (user, email) {
  user = User.updateEmail(user, email)
  await db.put(user)
  // sendValidationEmail doesn't need to access the last _rev
  // so it's ok to pass the user as it was before the database was updated
  await sendValidationEmail(user)
}
