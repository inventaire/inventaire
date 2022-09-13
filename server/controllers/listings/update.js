const { updateAttributes } = require('controllers/listings/lib/listings')

const sanitization = {
  id: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
}

const controller = async params => {
  const listing = await updateAttributes(params)
  return { list: listing }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'lists', 'update' ]
}
