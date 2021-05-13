const _ = require('builders/utils')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const clients_ = require('./lib/oauth/clients')

const sanitization = {
  ids: {},
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(getClientsByIds)
  .then(responses_.Wrap(res, 'clients'))
  .catch(error_.Handler(req, res))
}

const getClientsByIds = async ({ ids }) => {
  let clients = await clients_.byIds(ids)
  clients = clients.map(omitPrivateData)
  return _.keyBy(clients, '_id')
}

const omitPrivateData = client => _.omit(client, privateAttributes)

const privateAttributes = [
  'secret'
]
