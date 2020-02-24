const __ = require('config').universalPath
const { request, customAuthReq } = require('./request')
const randomString = __.require('lib', 'utils/random_string')
const { createUser, createAdminUser, getRefreshedUser } = require('../fixtures/users')
require('should')

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
  authReq: (...args) => customAuthReq(API.getUser(), ...args),
  authReqB: (...args) => customAuthReq(API.getUserB(), ...args),
  authReqC: (...args) => customAuthReq(API.getUserC(), ...args),
  adminReq: (...args) => customAuthReq(API.getAdminUser(), ...args),

  // Create users only if needed by the current test suite
  getUser: getUserGetter('a'),
  getUserId: () => API.getUser().then(({ _id }) => _id),
  getUserB: getUserGetter('b'),
  getUserC: getUserGetter('c'),
  getAdminUser: getUserGetter('admin', true),
  getUserGetter,
  // To be used when you need a user not used by any other tests
  getReservedUser: customData => getUserGetter(randomString(8), false, customData)()
}

Object.assign(API, require('../../unit/utils'))
