CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'

# /!\ lots of weird version issues possible making most of the libs irrelevant
# Identity: v2
# Swift: v1

{ username, password, authUrl, tenantName, region, publicURL } = require('config').swift
breq = require 'bluereq'

lastToken = null
lastTokenExpirationTime = 0
# let a 10 minutes margin before token expiration
tenMinutes = 10*60*1000
tokenExpired = -> _.now() > (lastTokenExpirationTime - tenMinutes)

module.exports = ->
  if lastToken? and not tokenExpired() then promises_.resolve lastToken
  else
    breq.post
      url: "#{authUrl}/tokens"
      headers:
        'Content-Type': 'application/json'
      body:
        auth:
          passwordCredentials:
            username: username
            password: password
          tenantName: tenantName
    .then _.property('body')
    .then parseIdentificationRes
    .catch _.ErrorRethrow('getToken')

parseIdentificationRes = (res)->
  { token, serviceCatalog } = res.access
  verifyEndpoint serviceCatalog
  { expires, id } = token
  lastToken = id
  lastTokenExpirationTime = new Date(expires).getTime()
  # _.log [lastToken, lastTokenExpirationTime], 'new swift token'
  return id

verifyEndpoint = (serviceCatalog)->
  swiftData = _.find serviceCatalog, {name: 'swift'}
  # _.log swiftData, 'swiftData'
  endpoint = _.find swiftData.endpoints, { region: region }
  # _.log endpoint, 'endpoint'
  if endpoint.publicURL isnt publicURL
    throw new Error "config publicURL and returned publicURL don't match"
