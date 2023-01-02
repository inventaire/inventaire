import user_ from '#controllers/user/lib/user'
import shelves_ from '#controllers/shelves/lib/shelves'

export default async (shelfId, reqUserId) => {
  const shelf = await shelves_.byId(shelfId)
  const user = await user_.byId(shelf.owner)

  return {
    users: [ user ],

    shelves: [ shelf ],

    reqUserId,

    feedOptions: {
      title: `${shelf.name} - ${user.username}`,
      description: shelf.description,
      image: null,
      queryString: `shelf=${shelfId}`,
      pathname: `shelves/${shelfId}`
    }
  }
}
