const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

module.exports = (types, label, fn) => {
  // Cloning types to keep the initial object intact
  types = types.slice()
  const executeNext = () => {
    const type = types.shift()
    if (!type) return

    _.info(type, `${label} starting`)

    return fn(type)
    .then(executeNext)
  }

  return executeNext()
}
