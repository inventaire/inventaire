CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
host = CONFIG.fullHost()
authEndpoint = host + '/api/auth'
faker = require 'faker'
{ makeUserAdmin } = __.require 'controllers', 'user/lib/user'
{ request, rawRequest } = require '../utils/request'
randomString = __.require 'lib', './utils/random_string'

connect = (endpoint, userData)-> rawRequest 'post', { url: endpoint, body: userData }
signup = (userData)-> connect "#{authEndpoint}?action=signup", userData
login = (userData)->
  connect "#{authEndpoint}?action=login", userData
  .catch (err)->
    if err.statusCode isnt 401 then throw err
    return signup userData

module.exports = API =
  signup: (email)->
    signup
      email: email
      username: API.createUsername()
      password: faker.internet.password()

  createUser: (customData = {})->
    username = customData.username or API.createUsername()
    userData =
      username: username
      password: '12345678'
      email: "#{username}@adomain.org"

    # Try to login first if the username is given, as a user with this username
    # might still exist if the database wasn't reset since the last test session
    authPromise = if username? then login(userData) else signup(userData)

    authPromise
    .then parseCookie
    .then API.getUserWithCookie
    .tap setCustomData(customData)
    .then refreshUser

  createAdminUser: (data)->
    API.createUser data
    .tap (user)-> makeUserAdmin user._id

  getUserWithCookie: (cookie)->
    request 'get', '/api/user', null, cookie
    .then (user)->
      user.cookie = cookie
      return user

  getRefreshedUser: (userPromise)->
    userPromise
    # Get the up-to-date user doc while keeping the cookie
    # set by tests/api/fixtures/users
    .then (user)-> API.getUserWithCookie user.cookie

  createUsername: ->
    # Add a random string to prevent creating several users with the same username
    # and be rejected because of it
    faker.fake('{{name.firstName}}').replace(/\W/, '') + randomString(2)

parseCookie = (res)-> res.headers['set-cookie'].join ';'

setCustomData = (customData)-> (user)->
  delete customData.username

  # Make updates sequentially to avoid update conflicts
  sequentialUpdate = Promise.resolve()

  for attribute, value of customData
    sequentialUpdate = sequentialUpdate
      .then -> setUserAttribute user, attribute, value

  return sequentialUpdate

setUserAttribute = (user, attribute, value)->
  request 'put', '/api/user', { attribute, value }, user.cookie

refreshUser = (user)-> API.getUserWithCookie user.cookie
