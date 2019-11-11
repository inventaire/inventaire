// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let API
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const promises_ = __.require('lib', 'promises')
const host = CONFIG.fullHost()
const authEndpoint = host + '/api/auth'
const { createUser, createAdminUser, getRefreshedUser } = require('../fixtures/users')
const { request, customAuthReq } = require('./request')

const userPromises = {}
const getUserGetter = (key, admin = false, customData) => (function() {
  if (userPromises[key] == null) {
    const createFn = admin ? createAdminUser : createUser
    userPromises[key] = createFn(customData)
  }
  return getRefreshedUser(userPromises[key])
})

module.exports = (API = {
  nonAuthReq: request,
  customAuthReq,
  authReq(...args){ return customAuthReq(API.getUser(), ...Array.from(args)) },
  authReqB(...args){ return customAuthReq(API.getUserB(), ...Array.from(args)) },
  authReqC(...args){ return customAuthReq(API.getUserC(), ...Array.from(args)) },
  adminReq(...args){ return customAuthReq(API.getAdminUser(), ...Array.from(args)) },

  // Create users only if needed by the current test suite
  getUser: getUserGetter('a'),
  getUserId() { return API.getUser().get('_id') },
  getUserB: getUserGetter('b'),
  getUserC: getUserGetter('c'),
  getAdminUser: getUserGetter('admin', true),
  getUserGetter
})

_.extend(API, require('../../unit/utils'))
