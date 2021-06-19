const _ = require('builders/utils')
const clients_ = require('./lib/oauth/clients')

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

module.exports = { sanitization, controller }
