const _ = require('lodash')

const rolesByAccess = {
  public: [ 'public', 'authentified', 'dataadmin', 'admin' ],
  authentified: [ 'authentified', 'dataadmin', 'admin' ],
  dataadmin: [ 'dataadmin', 'admin' ],
  admin: [ 'admin' ]
}

const accessByRoles = {}

for (const access in rolesByAccess) {
  const roles = rolesByAccess[access]
  for (const role of roles) {
    accessByRoles[role] = accessByRoles[role] || []
    accessByRoles[role].push(access)
  }
}

const getUserAccessLevels = user => {
  if (!user) return []
  const { roles: userRoles } = user
  if (!userRoles || userRoles.length === 0) return []
  if (userRoles.length === 1) return accessByRoles[userRoles[0]]
  return _.uniq(_.flatten(userRoles.map(role => accessByRoles[role])))
}

const hasAdminAccess = user => getUserAccessLevels(user).includes('admin')

module.exports = { rolesByAccess, getUserAccessLevels, hasAdminAccess }
