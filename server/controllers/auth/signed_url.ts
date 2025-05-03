import { getUserById } from '#controllers/user/lib/user'
import { update as updateUser } from '#controllers/user/update'
import { getSignedPayload } from '#lib/emails/unsubscribe'
import { newError, notFoundError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { Req, Res } from '#types/server'
import type { User } from '#types/user'

const sanitization = {
  data: {
    generic: 'string',
  },
  sig: {
    generic: 'string',
  },
}

// Signed URLs sent in a mail should only act on a POST,
// to avoid getting triggered by anti-virus requests and such.
// GET requests should thus redirect to a page in the client allowing to trigger
// the corresponding action over a POST request
// See https://www.twilio.com/docs/sendgrid/ui/sending-email/list-unsubscribe
export async function signedUrlGetterController (params: SanitizedParameters, req: Req, res: Res) {
  const { data, sig } = params
  res.redirect(`/signed-url-action?data=${data}&sig=${sig}`)
}

export async function signedUrlActionController (params: SanitizedParameters) {
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

export const signedUrlGetter = {
  sanitization,
  controller: signedUrlGetterController,
}

export const signedUrlAction = {
  // Set nonJsonBody=true to force the sanitization function to parse the req.query
  sanitization: { ...sanitization, nonJsonBody: true },
  controller: signedUrlActionController,
}
