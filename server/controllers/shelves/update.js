import { updateAttributes } from '#controllers/shelves/lib/shelves'

const sanitization = {
  shelf: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
  color: { optional: true },
}

const controller = async params => {
  const shelf = await updateAttributes(params)
  return { shelf }
}

export default {
  sanitization,
  controller,
  track: [ 'shelf', 'update' ]
}
