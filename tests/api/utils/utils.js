import { createUser, getRefreshedUser } from '../fixtures/users.js'
import { humanName } from '../fixtures/text.js'
import { request, customAuthReq, rawCustomAuthReq } from './request.js'
import 'should'

const userPromises = {}
const getUserGetter = (key, role, customData) => () => {
  if (userPromises[key] == null) {
    userPromises[key] = createUser(customData, role)
  }
  return getRefreshedUser(userPromises[key])
}

const API = {
  publicReq: request,
  customAuthReq,
  authReq: (...args) => customAuthReq(API.getUser(), ...args),
  authReqB: (...args) => customAuthReq(API.getUserB(), ...args),
  authReqC: (...args) => customAuthReq(API.getUserC(), ...args),
  adminReq: (...args) => customAuthReq(API.getAdminUser(), ...args),
  dataadminReq: (...args) => customAuthReq(API.getDataadminUser(), ...args),

  rawAuthReq: ({ method, url }) => rawCustomAuthReq({ user: API.getUser(), method, url }),

  // Create users only if needed by the current test suite
  getUser: getUserGetter('a'),
  getUserA: getUserGetter('a'),
  getUserB: getUserGetter('b'),
  getUserC: getUserGetter('c'),
  getUserId: () => API.getUser().then(({ _id }) => _id),
  getFediversableUser: getUserGetter(null, null, { fediversable: true }),
  getAdminUser: getUserGetter('admin', 'admin'),
  getDataadminUser: getUserGetter('dataadmin', 'dataadmin'),
  getUserGetter,
  // To be used when you need a user not used by any other tests
  getReservedUser: customData => getUserGetter(humanName(), null, customData)(),
  getDeanonymizedUser: getUserGetter('deanonymized', null, {
    'settings.contributions.anonymize': false
  })
}

export default API

Object.assign(API, require('../../unit/utils'))
