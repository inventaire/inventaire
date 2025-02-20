import 'should'
import { getOrCreateUser, getRefreshedUser, type CustomUserData } from '#fixtures/users'
import { remoteEntitiesOrigin } from '#server/config'
import type { AbsoluteUrl, HttpHeaders, HttpMethod, RelativeUrl } from '#types/common'
import type { UserRole } from '#types/user'
import { request, customAuthReq, rawCustomAuthReq } from './request.js'
import type { ArrayTail } from 'type-fest'

const userPromises = {}

export function getUserGetter (key: string, role?: UserRole, customData?: CustomUserData, origin?: AbsoluteUrl) {
  return function () {
    if (userPromises[key] == null) {
      userPromises[key] = getOrCreateUser(customData, role, origin)
    }
    return getRefreshedUser(userPromises[key], origin)
  }
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
export const getFediversableUser = getUserGetter(undefined, undefined, { fediversable: true })
export const getAdminUser = getUserGetter('admin', 'admin')
export const getDataadminUser = getUserGetter('dataadmin', 'dataadmin')
export const getDeanonymizedUser = getUserGetter('deanonymized', undefined, {
  'settings.contributions.anonymize': false,
})

export const getRemoteInstanceUser = getUserGetter('remote', undefined, undefined, remoteEntitiesOrigin)
export const getRemoteInstanceAdmin = getUserGetter('remote_admin', 'admin', undefined, remoteEntitiesOrigin)
export const getRemoteInstanceDataadmin = getUserGetter('remote_admin', 'dataadmin', undefined, remoteEntitiesOrigin)

export function remoteUserAuthReq (method: HttpMethod, endpoint: RelativeUrl, body?: unknown, headers: HttpHeaders = {}) {
  const url = `${remoteEntitiesOrigin}${endpoint}` as AbsoluteUrl
  return customAuthReq(getRemoteInstanceUser(), method, url, body, headers)
}

export function remoteAdminReq (method: HttpMethod, endpoint: RelativeUrl, body?: unknown, headers: HttpHeaders = {}) {
  const url = `${remoteEntitiesOrigin}${endpoint}` as AbsoluteUrl
  return customAuthReq(getRemoteInstanceAdmin(), method, url, body, headers)
}

export function remoteDataadminReq (method: HttpMethod, endpoint: RelativeUrl, body?: unknown, headers: HttpHeaders = {}) {
  const url = `${remoteEntitiesOrigin}${endpoint}` as AbsoluteUrl
  return customAuthReq(getRemoteInstanceDataadmin(), method, url, body, headers)
}
