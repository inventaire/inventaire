import { getShelfById } from '#controllers/shelves/lib/shelves'
import { getUserById } from '#controllers/user/lib/user'

export default async (shelfId, reqUserId) => {
  const shelf = await getShelfById(shelfId)
  const user = await getUserById(shelf.owner)

  return {
    users: [ user ],

    shelves: [ shelf ],

    reqUserId,

    feedOptions: {
      title: `${shelf.name} - ${user.username}`,
      description: shelf.description,
      image: null,
      queryString: `shelf=${shelfId}`,
      pathname: `shelves/${shelfId}`,
    },
  }
}
