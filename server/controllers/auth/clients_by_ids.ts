import { keyBy, omit } from 'lodash-es'
import { getOauthClientsByIds } from '#controllers/auth/lib/oauth/clients'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  ids: {},
}

async function controller ({ ids }: SanitizedParameters) {
  const clients = await getOauthClientsByIds(ids)
  const formattedClients = clients.map(omitPrivateData)
  return {
    clients: keyBy(formattedClients, '_id'),
  }
}

const omitPrivateData = client => omit(client, privateAttributes)

const privateAttributes = [
  'secret',
] as const

export default { sanitization, controller }
