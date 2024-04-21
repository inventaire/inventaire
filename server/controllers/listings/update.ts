import { updateListingAttributes } from '#controllers/listings/lib/listings'

const sanitization = {
  id: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
}

async function controller (params) {
  const listing = await updateListingAttributes(params)
  return { list: listing }
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'update' ],
}
