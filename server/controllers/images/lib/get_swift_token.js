// Identity: v2
// Swift: v1
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const breq = require('bluereq')
const { tenMinutes } = __.require('lib', 'times')

let lastToken
let lastTokenExpirationTime = 0
// let a 10 minutes margin before token expiration
const tokenExpired = () => Date.now() > (lastTokenExpirationTime - tenMinutes)

const { username, password, authUrl, tenantName, region, publicURL } = CONFIG.mediaStorage.swift

const postParams = {
  url: `${authUrl}/tokens`,
  headers: { 'Content-Type': 'application/json' },
  body: {
    auth: {
      passwordCredentials: { username, password },
      tenantName
    }
  }
}

module.exports = () => {
  if (lastToken && !tokenExpired()) return promises_.resolve(lastToken)

  return breq.post(postParams)
  .get('body')
  .then(parseIdentificationRes)
  .catch(_.ErrorRethrow('getToken'))
}

const parseIdentificationRes = res => {
  const { token, serviceCatalog } = res.access
  verifyEndpoint(serviceCatalog)
  const { expires, id } = token
  lastToken = id
  lastTokenExpirationTime = new Date(expires).getTime()
  return id
}

const verifyEndpoint = serviceCatalog => {
  const swiftData = _.find(serviceCatalog, { name: 'swift' })
  const endpoint = _.find(swiftData.endpoints, { region })
  if (endpoint.publicURL !== publicURL) {
    throw new Error("config publicURL and returned publicURL don't match")
  }
}
