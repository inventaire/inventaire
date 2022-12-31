import _ from 'builders/utils'
import clients_ from './lib/oauth/clients'

const sanitization = {
  ids: {},
}

const controller = async ({ ids }) => {
  let clients = await clients_.byIds(ids)
  clients = clients.map(omitPrivateData)
  return {
    clients: _.keyBy(clients, '_id')
  }
}

const omitPrivateData = client => _.omit(client, privateAttributes)

const privateAttributes = [
  'secret'
]

export default { sanitization, controller }
