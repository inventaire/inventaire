const user_ = require('controllers/user/lib/user')
const shelves_ = require('controllers/shelves/lib/shelves')

module.exports = async (shelfId, reqUserId) => {
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
