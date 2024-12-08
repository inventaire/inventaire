import { addItemsToShelves, createShelf } from '#controllers/shelves/lib/shelves'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { NewShelf } from '#types/shelf'

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: { optional: true },
  color: { optional: true },
  items: { optional: true },
}

async function controller (params: SanitizedParameters) {
  const { items: itemsIds, reqUserId } = params
  const shelf = await formatNewShelf(params)
  if (itemsIds) await addItemsToShelves([ shelf._id ], itemsIds, reqUserId)
  return { shelf }
}

function formatNewShelf (params) {
  const { name, description, visibility, color, reqUserId: owner } = params
  const shelfData: NewShelf = {
    name,
    description,
    visibility,
    owner,
  }
  if (color != null) shelfData.color = color
  return createShelf(shelfData)
}

export default {
  sanitization,
  controller,
  track: [ 'shelf', 'creation' ],
}
