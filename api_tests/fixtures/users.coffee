CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
should = require 'should'
host = CONFIG.fullHost()
authEndpoint = host + '/api/auth'
randomString = __.require 'lib', './utils/random_string'
{ makeUserAdmin } = __.require 'controllers', 'user/lib/user'
{ request } = require '../utils/request'

connect = (endpoint, userData)-> breq.post { url: endpoint, body: userData }
signup = (userData)-> connect "#{authEndpoint}?action=signup", userData
login = (userData)->
  connect "#{authEndpoint}?action=login", userData
  .catch (err)->
    if err.statusCode isnt 401 then throw err
    return signup userData

module.exports = API =
  signup: (email)->
    signup { email, username: randomString(8), password: randomString(8) }

  createUser: (username)->
    str = username or randomString(10)
    userData =
      username: str
      password: str
      email: "#{str}@foo.org"

    # Try to login first if the username is given, as a user with this username
    # might still exist if the database wasn't reset since the last test session
    authPromise = if username? then login(userData) else signup(userData)

    authPromise
    .then parseCookie
    .then API.getUserWithCookie

  createAdminUser: ->
    API.createUser()
    .tap (user)-> makeUserAdmin user._id

  getUserWithCookie: (cookie)->
    request 'get', '/api/user', null, cookie
    .then (user)->
      user.cookie = cookie
      return user

  getRefreshedUser: (userPromise)->
    userPromise
    # Get the up-to-date user doc while keeping the cookie
    # set by api_tests/fixtures/users
    .then (user)-> API.getUserWithCookie user.cookie

parseCookie = (res)-> res.headers['set-cookie'].join ';'
