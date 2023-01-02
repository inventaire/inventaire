import user_ from '#controllers/user/lib/user'

const sanitization = {
  ids: {}
}

const controller = async ({ ids, reqUserId }) => {
  const users = await user_.getUsersIndexByIds(ids, reqUserId)
  return { users }
}

export default { sanitization, controller }
