import 'should'
import { getOrCreateUser, getRefreshedUser } from '#fixtures/users'
import type { UserRole } from '#server/types/user'
import { request, customAuthReq, rawCustomAuthReq } from './request.js'
import type { ArrayTail } from 'type-fest/source/internal.js'

const userPromises = {}

export const getUserGetter = (key: string, role?: UserRole, customData?: CustomUserData) => () => {
  if (userPromises[key] == null) {
    userPromises[key] = getOrCreateUser(customData, role)
  }
  return getRefreshedUser(userPromises[key])
}

export const publicReq = request

type CustomAuthReqPartialParams = ArrayTail<Parameters<typeof customAuthReq>>

export const authReq = (...args: CustomAuthReqPartialParams) => customAuthReq(getUser(), ...args)
export const authReqB = (...args: CustomAuthReqPartialParams) => customAuthReq(getUserB(), ...args)
export const authReqC = (...args: CustomAuthReqPartialParams) => customAuthReq(getUserC(), ...args)
export const adminReq = (...args: CustomAuthReqPartialParams) => customAuthReq(getAdminUser(), ...args)
export const dataadminReq = (...args: CustomAuthReqPartialParams) => customAuthReq(getDataadminUser(), ...args)

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
