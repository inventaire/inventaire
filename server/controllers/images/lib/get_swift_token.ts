// Identity: v3
import { newError } from '#lib/error/error'
// Swift: v2
import { requests_ } from '#lib/requests'
import { tenMinutes } from '#lib/time'
import { logError } from '#lib/utils/logs'
import config from '#server/config'
import type { AbsoluteUrl } from '#types/common'

let lastToken
let lastTokenExpirationTime = 0
// let a 10 minutes margin before token expiration
const tokenExpired = () => Date.now() > (lastTokenExpirationTime - tenMinutes)

const { username, password, authUrl, tenantName } = config.mediaStorage.swift

// source: https://docs.openstack.org/keystone/pike/contributor/http-api.html#i-have-a-non-python-client
const url = `${authUrl}/v3/auth/tokens` as AbsoluteUrl
const reqHeaders = { 'content-type': 'application/json' }
const body = {
  auth: {
    identity: {
      methods: [ 'password' ],
      password: {
        user: {
          domain: { id: 'default' },
          name: username,
          password,
        },
      },
    },
    scope: {
      project: {
        domain: { id: 'default' },
        name: tenantName,
      },
    },
  },
}

export default async function () {
  if (lastToken && !tokenExpired()) return lastToken

  return requests_.post(url, { body, headers: reqHeaders, returnBodyOnly: false })
  .then(parseIdentificationRes)
  .catch(err => {
    err.serviceStatusCode = err.statusCode
    // Override status code to fit the status that should be return to users
    err.statusCode = 500
    logError(err, 'getToken')
    throw err
  })
}

function parseIdentificationRes ({ body, headers }) {
  const newToken = headers['x-subject-token']
  if (!newToken) throw newError('swift token not found', 500, { headers })

  const expirationTime = body.token.expires_at && (new Date(body.token.expires_at)).getTime()
  if (!expirationTime) throw newError('swift expiration time not found', 500, { body, headers })

  lastToken = newToken
  lastTokenExpirationTime = expirationTime
  return lastToken
}
