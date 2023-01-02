import shelves_ from '#controllers/shelves/lib/shelves'

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: { optional: true },
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
  return shelves_.create(shelfData)
}

export default {
  sanitization,
  controller,
  track: [ 'shelf', 'creation' ]
}
