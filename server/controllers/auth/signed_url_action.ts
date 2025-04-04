import { getUserById } from '#controllers/user/lib/user'
import { update as updateUser } from '#controllers/user/update'
import { getSignedPayload } from '#lib/emails/unsubscribe'
import { newError, notFoundError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { User } from '#types/user'

const sanitization = {
  data: {
    generic: 'string',
  },
  sig: {
    generic: 'string',
  },
}

export async function controller (params: SanitizedParameters) {
  const { data, sig } = params
  const actionData = getSignedPayload(data, sig)
  const { userId, endpoint, action } = actionData
  const user = await getUserById(userId)
  if (!user) throw notFoundError({ userId })
  const actionAdaptor = actionAdaptorByEndpointAndAction[endpoint]?.[action]
  if (!actionAdaptor) throw notFoundError({ endpoint, action })
  await actionAdaptor(user, actionData)
  return { ok: true }
}

const actionAdaptorByEndpointAndAction = {
  user: {
    async update (user: User, actionData: { attribute: string, value: unknown }) {
      const { attribute, value } = actionData
      if (attribute.startsWith('settings.notifications')) {
        return updateUser(user, attribute, value)
      } else {
        throw newError('unsupported user update by signed url', 400, actionData)
      }
    },
  },
} as const

export default { sanitization, controller }
