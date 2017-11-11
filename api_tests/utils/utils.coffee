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

userAPromise = null
userBPromise = null
adminUserPromise = null

module.exports = API =
  nonAuthReq: request
  customAuthReq: customAuthReq
  authReq: (args...)-> customAuthReq API.getUser(), args...
  authReqB: (args...)-> customAuthReq API.getUserB(), args...
  adminReq: (args...)-> customAuthReq API.getAdminUser(), args...

  getUser: ->
    # Create users only if needed
    userAPromise or= createUser()
    return getRefreshedUser userAPromise

  getUserB: ->
    userBPromise or= createUser()
    return getRefreshedUser userBPromise

  getAdminUser: ->
    adminUserPromise or= createAdminUser()
    return getRefreshedUser adminUserPromise

  # A function to quickly fail when a test gets an undesired positive answer
  undesiredRes: (done)-> (res)->
    done new Error(".then function was expected not to be called")
    _.warn res, 'undesired positive res'

  undesiredErr: (done)-> (err)->
    done err
    _.warn err.body or err, 'undesired err body'
