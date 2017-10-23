CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
host = CONFIG.fullHost()
breq = require 'bluereq'

request = (method, endpoint, body, cookie)->
  data =
    url: host + endpoint
    headers: { cookie }

  if body? then data.body = body

  return breq[method](data).get 'body'
  # .catch _.ErrorRethrow("#{method} #{endpoint} #{JSON.stringify(body)} err")

customAuthReq = (userPromise, method, endpoint, body)->
  userPromise
  # gets a user doc to which api_tests/fixtures/users added a cookie attribute
  .then (user)-> request method, endpoint, body, user.cookie

module.exports = { request, customAuthReq }
