# Identity: v2
# Swift: v1

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
breq = require 'bluereq'
{ tenMinutes } =  __.require 'lib', 'times'

lastToken = null
lastTokenExpirationTime = 0
# let a 10 minutes margin before token expiration
tokenExpired = -> Date.now() > (lastTokenExpirationTime - tenMinutes)

{ username, password, authUrl, tenantName, region, publicURL } = CONFIG.swift

postParams =
  url: "#{authUrl}/tokens"
  headers: { 'Content-Type': 'application/json' }
  body:
    auth:
      passwordCredentials: { username, password }
      tenantName: tenantName

module.exports = ->
  if lastToken? and not tokenExpired() then return promises_.resolve lastToken

  breq.post postParams
  .get 'body'
  .then parseIdentificationRes
  .catch _.ErrorRethrow('getToken')

parseIdentificationRes = (res)->
  { token, serviceCatalog } = res.access
  verifyEndpoint serviceCatalog
  { expires, id } = token
  lastToken = id
  lastTokenExpirationTime = new Date(expires).getTime()
  return id

verifyEndpoint = (serviceCatalog)->
  swiftData = _.find serviceCatalog, { name: 'swift' }
  endpoint = _.find swiftData.endpoints, { region }
  if endpoint.publicURL isnt publicURL
    throw new Error "config publicURL and returned publicURL don't match"
