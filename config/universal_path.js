// Call module-alias register before trying to access _moduleAliases
// as it will convert those to their absolute paths
require('module-alias/register')

const { _moduleAliases } = require('../package.json')

const path = (route, name) => {
  if (!(route && name)) throw new Error(`needs route and name (got route: ${route} / name: ${name})`)
  const path = _moduleAliases[route]
  if (name != null) return `${path}/${name}`
  else return path
}

module.exports = {
  path,
  require: (route, name) => require(path(route, name))
}
