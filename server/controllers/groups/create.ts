import { createGroup } from '#controllers/groups/lib/groups'
import { checkSpamContent } from '#controllers/user/lib/spam'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

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
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { name, description, position, open, reqUserId } = params
  let { searchable } = params

  if (searchable == null) searchable = true

  await checkSpamContent(req.user, name, description)

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
