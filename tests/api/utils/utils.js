
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('should')
const { createUser, createAdminUser, getRefreshedUser } = require('../fixtures/users')
const { request, customAuthReq } = require('./request')

const userPromises = {}
const getUserGetter = (key, admin = false, customData) => () => {
  if (userPromises[key] == null) {
    const createFn = admin ? createAdminUser : createUser
    userPromises[key] = createFn(customData)
  }
  return getRefreshedUser(userPromises[key])
}

const API = module.exports = {
  nonAuthReq: request,
  customAuthReq,
  authReq: (...args) => customAuthReq(API.getUser(), ...Array.from(args)),
  authReqB: (...args) => customAuthReq(API.getUserB(), ...Array.from(args)),
  authReqC: (...args) => customAuthReq(API.getUserC(), ...Array.from(args)),
  adminReq: (...args) => customAuthReq(API.getAdminUser(), ...Array.from(args)),

  // Create users only if needed by the current test suite
  getUser: getUserGetter('a'),
  getUserId: () => API.getUser().get('_id'),
  getUserB: getUserGetter('b'),
  getUserC: getUserGetter('c'),
  getAdminUser: getUserGetter('admin', true),
  getUserGetter
}

Object.assign(API, require('../../unit/utils'))
