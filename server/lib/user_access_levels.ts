import { uniq } from 'lodash-es'

export const rolesByAccess = {
  public: [ 'public', 'authentified', 'dataadmin', 'admin' ],
  authentified: [ 'authentified', 'dataadmin', 'admin' ],
  dataadmin: [ 'dataadmin', 'admin' ],
  admin: [ 'admin' ],
}

const accessByRoles = {}

for (const access in rolesByAccess) {
  const roles = rolesByAccess[access]
  for (const role of roles) {
    accessByRoles[role] = accessByRoles[role] || []
    accessByRoles[role].push(access)
  }
}

export function getUserAccessLevels (user) {
  if (!user) return []
  const { roles: userRoles } = user
  if (!userRoles || userRoles.length === 0) return []
  if (userRoles.length === 1) return accessByRoles[userRoles[0]]
  return uniq(userRoles.map(role => accessByRoles[role]).flat())
}

export const hasAdminAccess = user => getUserAccessLevels(user).includes('admin')
export const hasDataadminAccess = user => getUserAccessLevels(user).includes('dataadmin')
