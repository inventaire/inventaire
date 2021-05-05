// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('lodash')

const getUserAccessLevels = ({ roles: userRoles = [] }) => {
  return _.uniq(_.flatten(userRoles.map(role => accessByRoles[role])))
}

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

module.exports = { rolesByAccess, getUserAccessLevels }
