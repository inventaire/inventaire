CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
should = require 'should'
promises_ = __.require 'lib', 'promises'
host = CONFIG.fullHost()
authEndpoint = host + '/api/auth'
randomString = __.require 'lib', './utils/random_string'
{ createUser, createAdminUser, getRefreshedUser } = require '../fixtures/users'
{ request, customAuthReq } = require './request'

userPromises = {}
getUserGetter = (key, admin = false)-> ()->
  unless userPromises[key]?
    createFn = if admin then createAdminUser else createUser
    userPromises[key] = createFn()
  return getRefreshedUser userPromises[key]

module.exports = API =
  nonAuthReq: request
  customAuthReq: customAuthReq
  authReq: (args...)-> customAuthReq API.getUser(), args...
  authReqB: (args...)-> customAuthReq API.getUserB(), args...
  authReqC: (args...)-> customAuthReq API.getUserC(), args...
  adminReq: (args...)-> customAuthReq API.getAdminUser(), args...

  # Create users only if needed by the current test suite
  getUser: getUserGetter 'a'
  getUserB: getUserGetter 'b'
  getUserC: getUserGetter 'c'
  getAdminUser: getUserGetter 'admin', true

  # A function to quickly fail when a test gets an undesired positive answer
  undesiredRes: (done)-> (res)->
    done new Error('.then function was expected not to be called')
    _.warn res, 'undesired positive res'

  undesiredErr: (done)-> (err)->
    done err
    _.warn err.body or err, 'undesired err body'
