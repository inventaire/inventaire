import { createGroup } from '#controllers/groups/lib/groups'

const sanitization = {
  name: {},
  description: { optional: true },
  position: { optional: true },
  searchable: {
    optional: true,
    generic: 'boolean',
  },
  open: {
    optional: true,
    generic: 'boolean',
  },
}

async function controller (params) {
  const { name, description, position, open, reqUserId } = params
  let { searchable } = params

  if (searchable == null) searchable = true

  return createGroup({
    name,
    description: description || '',
    searchable,
    position: position || null,
    creatorId: reqUserId,
    open: open || false,
  })
}

export default {
  sanitization,
  controller,
  track: [ 'groups', 'create' ],
}
