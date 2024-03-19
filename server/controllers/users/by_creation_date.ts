import { omitPrivateData } from '#controllers/user/lib/authorized_user_data_pickers'
import { getUsersByCreationDate } from '#controllers/users/lib/users'

const sanitization = {
  limit: {},
  offset: {},
}

const controller = async ({ limit, offset }) => {
  const users = await getUsersByCreationDate({ limit, offset })
  return {
    users: users.map(omitPrivateData()),
  }
}

export default { sanitization, controller }
