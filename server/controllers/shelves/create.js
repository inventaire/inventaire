const shelves_ = require('controllers/shelves/lib/shelves')

const sanitization = {
  name: {},
  description: { optional: true },
  listing: {
    allowlist: [ 'public', 'private', 'network' ]
  },
  color: { optional: true },
  items: { optional: true }
}

const controller = async params => {
  const { items, reqUserId } = params
  const shelf = await formatNewShelf(params)
  if (items) await shelves_.addItems([ shelf._id ], items, reqUserId)
  return { shelf }
}

const formatNewShelf = params => {
  const { name, description, listing, color, reqUserId: owner } = params
  const shelfData = {
    name,
    description,
    listing,
    owner,
  }
  if (color != null) shelfData.color = color
  return shelves_.create(shelfData)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'shelf', 'creation' ]
}
