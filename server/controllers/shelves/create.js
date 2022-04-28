const createShelf = require('controllers/shelves/lib/create')

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {},
  color: { optional: true },
  items: { optional: true }
}

const controller = async params => {
  const { items: itemsIds, reqUserId } = params
  const shelf = await formatNewShelf(params)
  if (itemsIds) await shelves_.addItems([ shelf._id ], itemsIds, reqUserId)
  return { shelf }
}

const formatNewShelf = params => {
  const { name, description, visibility, color, reqUserId: owner } = params
  const shelfData = {
    name,
    description,
    visibility,
    owner,
  }
  if (color != null) shelfData.color = color
  return createShelf(shelfData)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'shelf', 'creation' ]
}
