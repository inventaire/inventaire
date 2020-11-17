// Identity: v3
// Swift: v2
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { tenMinutes } = __.require('lib', 'time')
const requests_ = __.require('lib', 'requests')

let lastToken
let lastTokenExpirationTime = 0
// let a 10 minutes margin before token expiration
const tokenExpired = () => Date.now() > (lastTokenExpirationTime - tenMinutes)

const { username, password, authUrl, tenantName } = CONFIG.mediaStorage.swift

// source: https://docs.openstack.org/keystone/pike/contributor/http-api.html#i-have-a-non-python-client
const url = `${authUrl}/v3/auth/tokens`
const reqHeaders = { 'content-type': 'application/json' }
const body = {
  auth: {
    identity: {
      methods: [ 'password' ],
      password: {
        user: {
          domain: { id: 'default' },
          name: username,
          password
        }
      }
    },
    scope: {
      project: {
        domain: { id: 'default' },
        name: tenantName
      }
    }
  }
}

module.exports = async () => {
  if (lastToken && !tokenExpired()) return lastToken

  return requests_.post(url, { body, headers: reqHeaders, returnBodyOnly: false })
  .then(parseIdentificationRes)
  .catch(err => {
    err.serviceStatusCode = err.statusCode
    // Override status code to fit the status that should be return to users
    err.statusCode = 500
    _.error(err, 'getToken')
    throw err
  })
}

const parseIdentificationRes = ({ body, headers }) => {
  const newToken = headers['x-subject-token']
  if (!newToken) throw error_.new('swift token not found', 500, { headers })

  const expirationTime = body.token.expires_at && (new Date(body.token.expires_at)).getTime()
  if (!expirationTime) throw error_.new('swift expiration time not found', 500, { body, headers })

  lastToken = newToken
  lastTokenExpirationTime = expirationTime
  return lastToken
}
