// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

// Call module-alias register before trying to access _moduleAliases
// as it will convert those to their absolute paths
require('module-alias/register')

const { _moduleAliases } = require('../package.json')

const path = (route, name) => {
  const path = _moduleAliases[route]
  if (name != null) return `${path}/${name}`
  else return path
}

module.exports = {
  path,
  require: (route, name) => require(path(route, name))
}
