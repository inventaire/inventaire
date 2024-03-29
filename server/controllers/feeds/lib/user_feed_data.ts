import { getUserById } from '#controllers/user/lib/user'

export default async (userId, reqUserId) => {
  const user = await getUserById(userId)
  return {
    users: [ user ],
    reqUserId,
    feedOptions: {
      title: user.username,
      description: user.bio,
      image: user.picture,
      queryString: `user=${user._id}`,
      pathname: `inventory/${user._id}`,
    },
  }
}
