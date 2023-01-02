import user_ from '#controllers/user/lib/user'

const sanitization = {
  bbox: {},
}

const controller = async ({ bbox, reqUserId }) => {
  let users = await user_.byPosition(bbox)
  users = await user_.getUsersAuthorizedData(users, reqUserId)
  return { users }
}

export default { sanitization, controller }
