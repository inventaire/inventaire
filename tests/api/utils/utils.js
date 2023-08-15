import 'should'
import { createUser, getOrCreateUser, getRefreshedUser } from '../fixtures/users.js'
import { request, customAuthReq, rawCustomAuthReq } from './request.js'

const userPromises = {}

export const getUserGetter = (key, role, customData) => () => {
  if (userPromises[key] == null) {
    userPromises[key] = getOrCreateUser(customData, role)
  }
  return getRefreshedUser(userPromises[key])
}

export const publicReq = request
export const authReq = (...args) => customAuthReq(getUser(), ...args)
export const authReqB = (...args) => customAuthReq(getUserB(), ...args)
export const authReqC = (...args) => customAuthReq(getUserC(), ...args)
export const adminReq = (...args) => customAuthReq(getAdminUser(), ...args)
export const dataadminReq = (...args) => customAuthReq(getDataadminUser(), ...args)

export const rawAuthReq = ({ method, url }) => rawCustomAuthReq({ user: getUser(), method, url })

// Create users only if needed by the current test suite
export const getUser = getUserGetter('a')
export const getUserA = getUserGetter('a')
export const getUserB = getUserGetter('b')
export const getUserC = getUserGetter('c')
export const getUserId = () => getUser().then(({ _id }) => _id)
export const getFediversableUser = getUserGetter(null, null, { fediversable: true })
export const getAdminUser = getUserGetter('admin', 'admin')
export const getDataadminUser = getUserGetter('dataadmin', 'dataadmin')
export const getDeanonymizedUser = getUserGetter('deanonymized', null, {
  'settings.contributions.anonymize': false,
})

// TODO: replace calls to getReservedUser with calls to createUser
export const getReservedUser = createUser
