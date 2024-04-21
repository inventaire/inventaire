import { updateShelfAttributes } from '#controllers/shelves/lib/shelves'

const sanitization = {
  shelf: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
  color: { optional: true },
}

async function controller (params) {
  const shelf = await updateShelfAttributes(params)
  return { shelf }
}

export default {
  sanitization,
  controller,
  track: [ 'shelf', 'update' ],
}
