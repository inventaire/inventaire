CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
fs_ = __.require 'lib', 'fs'
request = require 'request'
Promise = require 'bluebird'

getToken = require './get_swift_token'
{ publicURL, container } = CONFIG.swift

absoluteUrl = (filename)-> "#{publicURL}/#{container}/#{filename}"
relativeUrl = (filename)-> "/img/#{filename}"

getParams = (filename, body, type='application/json')->
  getToken()
  .then (token)->
    url: absoluteUrl filename
    headers:
      'Accept': 'application/json'
      'Content-Type': type
      'X-Auth-Token': token
    body: body

action = (verb, filename, body, type)->
  getParams filename, body, type
  .then _.Log('params')
  .then breq[verb]
  .then (res)-> res.body or { ok: true }
  .then _.Log("#{verb} #{filename} body")
  .catch _.ErrorRethrow("#{verb} #{filename}")

actions = {}
[ 'get', 'post', 'put', 'delete' ].forEach (verb)->
  actions[verb] = action.bind null, verb

module.exports = _.extend actions,
  # inspired by https://github.com/Automattic/knox/blob/master/lib/client.js
  putImage: (path, filename)->
    Promise.all [
        getParams filename
        fs_.contentHeaders path
      ]
    .spread (params, additionalHeaders)->
      { headers, url } = params
      _.extend headers, additionalHeaders
      new Promise (resolve, reject)->
        fs_.createReadStream path
        .pipe request(requestParams(url, headers))
        .on 'error', reject
        .on 'end', resolve.bind(null, relativeUrl(filename))

requestParams = (url, headers)->
  req =
    method: 'PUT'
    url: url
    headers: headers
