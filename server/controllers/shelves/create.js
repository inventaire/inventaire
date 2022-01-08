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
  const shelf = await formatNewShelf(params)
  return { shelf }
}

const formatNewShelf = params => {
  const { name, description, listing, color, reqUserId: owner } = params
  return shelves_.create({
    name,
    description,
    listing,
    owner,
    color,
  })
}

module.exports = {
  sanitization,
  controller,
  track: [ 'shelf', 'creation' ]
}
