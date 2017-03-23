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

testUserB =
  username: 'testuserb'
  password: 'testpassword'
  email: 'b+testemail@inventaire.io'

loginEndpoint = "#{authEndpoint}?action=login"
signupEndpoint = "#{authEndpoint}?action=signup"

parseCookies = (res) -> res.headers['set-cookie']

getUserCookies = (userData)->
  breq.post { url: loginEndpoint, body: userData }
  .catch (err)->
    if err.statusCode isnt 401 then throw err
    return breq.post { url: signupEndpoint, body: userData }
  .then parseCookies

userCookiesPromise = getUserCookies testUser
userBCookiesPromise = getUserCookies testUserB

request = (method, endpoint, body, cookies = [])->
  url = host + endpoint
  headers = { cookie: cookies.join ';' }
  return breq[method]({ url, body, headers }).get 'body'

AuthentifiedRequest = (cookiesPromise)-> (method, endpoint, body)->
  cookiesPromise
  .then request.bind(null, method, endpoint, body)

authentifiedRequest = AuthentifiedRequest userCookiesPromise
bUserAuthentifiedRequest = AuthentifiedRequest userBCookiesPromise
GetUser = (authentifiedRequester)-> ()-> authentifiedRequester 'get', '/api/user'

module.exports =
  authReq: authentifiedRequest
  nonAuthReq: request
  getUser: GetUser authentifiedRequest
  getUserB: GetUser bUserAuthentifiedRequest
