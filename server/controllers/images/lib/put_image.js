const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
// 'swift' or 'local'
const { mode } = CONFIG.mediaStorage
_.info(`media storage: ${mode}`)
const client = require(`./${mode}_client`)

module.exports = (container, path, id, filename) => {
  return client.putImage(container, path, filename)
  .then(_.Log('new image url'))
  .then(url => ({ id, url }))
}
