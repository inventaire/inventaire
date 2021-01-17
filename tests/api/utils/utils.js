const { request, customAuthReq, rawCustomAuthReq } = require('./request')
const randomString = require('lib/utils/random_string')
const { createUser, getRefreshedUser } = require('../fixtures/users')
require('should')

const userPromises = {}
const getUserGetter = (key, role, customData) => () => {
  if (userPromises[key] == null) {
    userPromises[key] = createUser(customData, role)
  }
  return getRefreshedUser(userPromises[key])
}

const API = module.exports = {
  publicReq: request,
  customAuthReq,
  authReq: (...args) => customAuthReq(API.getUser(), ...args),
  authReqB: (...args) => customAuthReq(API.getUserB(), ...args),
  authReqC: (...args) => customAuthReq(API.getUserC(), ...args),
  adminReq: (...args) => customAuthReq(API.getAdminUser(), ...args),
  dataadminReq: (...args) => customAuthReq(API.getDataadminUser(), ...args),

  rawAuthReq: (...args) => rawCustomAuthReq(API.getUser(), ...args),

  // Create users only if needed by the current test suite
  getUser: getUserGetter('a'),
  getUserId: () => API.getUser().then(({ _id }) => _id),
  getUserB: getUserGetter('b'),
  getUserC: getUserGetter('c'),
  getAdminUser: getUserGetter('admin', 'admin'),
  getDataadminUser: getUserGetter('dataadmin', 'dataadmin'),
  getUserGetter,
  // To be used when you need a user not used by any other tests
  getReservedUser: customData => getUserGetter(randomString(8), null, customData)()
}

Object.assign(API, require('../../unit/utils'))
