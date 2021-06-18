const shelves_ = require('controllers/shelves/lib/shelves')

const sanitization = {
  name: {},
  description: { optional: true },
  listing: {
    allowlist: [ 'public', 'private', 'network' ]
  },
  items: { optional: true }
}

const controller = async params => {
  const shelf = await formatNewShelf(params)
  return { shelf }
}

const formatNewShelf = params => {
  const { name, description, listing, reqUserId: owner } = params
  return shelves_.create({
    name,
    description,
    listing,
    owner,
  })
}

module.exports = {
  sanitization,
  controller,
  track: [ 'shelf', 'creation' ]
}
