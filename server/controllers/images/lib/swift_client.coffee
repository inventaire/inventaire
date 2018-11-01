CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
fs_ = __.require 'lib', 'fs'
request = require 'request'
{ Promise } = __.require 'lib', 'promises'
getToken = require './get_swift_token'
{ publicURL } = CONFIG.mediaStorage.swift

absoluteUrl = (container, filename)-> "#{publicURL}/#{container}/#{filename}"
relativeUrl = (container, filename)-> "/img/#{container}/#{filename}"

getParams = (container, filename, body, type = 'application/octet-stream')->
  getToken()
  .then (token)->
    url: absoluteUrl container, filename
    headers:
      'Accept': 'application/json'
      'Content-Type': type
      'X-Auth-Token': token
    body: body

action = (verb)-> (container, filename, body, type)->
  getParams container, filename, body, type
  .then _.Log('params')
  .then breq[verb]
  .then (res)-> res.body or { ok: true }
  .then _.Log("#{verb} #{filename} body")
  .catch _.ErrorRethrow("#{verb} #{filename}")

module.exports =
  get: action 'get'
  post: action 'post'
  put: action 'put'
  delete: action 'delete'

  # inspired by https://github.com/Automattic/knox/blob/master/lib/client.js
  putImage: (container, path, filename)->
    Promise.all [
        getParams container, filename
        fs_.contentHeaders path
      ]
    .spread (params, additionalHeaders)->
      { headers, url } = params
      _.extend headers, additionalHeaders
      new Promise (resolve, reject)->
        fs_.createReadStream path
        .pipe request({ method: 'PUT', url, headers })
        .on 'error', reject
        .on 'end', resolve.bind(null, relativeUrl(container, filename))
