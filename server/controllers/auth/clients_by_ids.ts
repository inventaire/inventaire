import { keyBy, omit } from 'lodash-es'
import { getOauthClientsByIds } from '#controllers/auth/lib/oauth/clients'

const sanitization = {
  ids: {},
}

async function controller ({ ids }) {
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
