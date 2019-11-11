CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
host = CONFIG.fullHost()
breq = require 'bluereq'

testServerAvailability = ->
  breq.get "#{host}/api/tests"
  .then (res)-> _.success 'tests server is ready'
  .timeout 1000
  .catch (err)->
    unless err.code is 'ECONNREFUSED' or err.name is 'TimeoutError' then throw err
    _.log 'waiting for tests server', null, 'grey'
    Promise.resolve()
    .delay 500
    .then testServerAvailability

waitForTestServer = testServerAvailability()

rawRequest = (method, breqParams)->
  waitForTestServer
  .then -> breq[method](breqParams)

request = (method, endpoint, body, cookie)->
  data =
    url: host + endpoint
    headers: { cookie }

  if body? then data.body = body

  waitForTestServer
  .then -> breq[method](data).get 'body'
  # .catch _.ErrorRethrow("#{method} #{endpoint} #{JSON.stringify(body)} err")

customAuthReq = (userPromise, method, endpoint, body)->
  userPromise
  # gets a user doc to which tests/api/fixtures/users added a cookie attribute
  .then (user)-> request method, endpoint, body, user.cookie

module.exports = { request, rawRequest, customAuthReq }
