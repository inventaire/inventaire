import { keyBy, omit } from 'lodash-es'
import { getOauthClientsByIds } from '#controllers/auth/lib/oauth/clients'

const sanitization = {
  ids: {},
}

async function controller ({ ids }) {
  let clients = await getOauthClientsByIds(ids)
  clients = clients.map(omitPrivateData)
  return {
    clients: keyBy(clients, '_id'),
  }
}

const omitPrivateData = client => omit(client, privateAttributes)

const privateAttributes = [
  'secret',
]

export default { sanitization, controller }
