const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const clientsDb = __.require('couch', 'base')('oauth_clients')
const { rawAuthReq } = require('../utils/utils')
const randomString = __.require('lib', 'utils/random_string')
const { parse: parseQuery } = require('querystring')
const { sha1 } = __.require('lib', 'crypto')
const { postUrlencoded } = require('./request')
const assert_ = __.require('utils', 'assert_types')

const getClient = async (params = {}) => {
  params.scope = params.scope || [ 'username' ]
  const { scope } = params

  assert_.array(scope)

  const client = {
    _id: sha1(JSON.stringify(params)),
    secret: randomString(30),
    redirectUris: [
      'http://localhost:8888/wiki/Special:OAuth2Client/callback',
    ],
    grants: [ 'authorization_code' ],
    scope
  }

  return clientsDb.get(client._id)
  .catch(err => {
    if (err.statusCode === 404) return clientsDb.putAndReturn(client)
    else throw err
  })
}

const getClientWithAuthorization = async (params = {}) => {
  const { scope = [ 'username' ] } = params
  const client = await getClient(params)
  const url = _.buildPath('/api/oauth/authorize', {
    client_id: client._id,
    state: randomString(20),
    response_type: 'code',
    scope: scope.join('+'),
  })
  const { headers } = await rawAuthReq('get', url)
  const authorizationData = parseQuery(headers.location.split('?')[1])
  return Object.assign(authorizationData, client)
}

const getToken = async ({ scope }) => {
  const { _id: clientId, secret, code, redirectUris } = await getClientWithAuthorization({ scope })
  const { body } = await postUrlencoded('/api/oauth/token', {
    client_id: clientId,
    client_secret: secret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUris[0],
  })
  return body
}

module.exports = { getClient, getClientWithAuthorization, getToken }
