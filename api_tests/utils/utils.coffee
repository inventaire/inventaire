CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
should = require 'should'
promises_ = __.require 'lib', 'promises'
host = CONFIG.fullHost()
authEndpoint = host + '/api/auth'
randomString = __.require 'lib', './utils/random_string'

testUser =
  username: 'testuser'
  password: 'testpassword'
  email: 'a+testemail@inventaire.io'

loginData =
  url: "#{authEndpoint}?action=login"
  body: testUser

signupData =
  url: "#{authEndpoint}?action=signup"
  body: testUser

parseCookies = (res) -> res.headers['set-cookie']

userCookiesPromise = breq.post loginData
  .catch (err)->
    if err.statusCode isnt 401 then throw err
    return breq.post signupData
  .then parseCookies

request = (method, endpoint, body, cookies = [])->
  url = host + endpoint
  headers = { cookie: cookies.join ';' }
  return breq[method]({ url, body, headers }).get 'body'

authentifiedRequest = (method, endpoint, body)->
  userCookiesPromise
  .then request.bind(null, method, endpoint, body)

module.exports =
  authReq: authentifiedRequest
  nonAuthReq: request
  getUser: -> authentifiedRequest 'get', '/api/user'
