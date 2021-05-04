const _ = require('builders/utils')
// 'swift' or 'local'
const { mode } = require('config').mediaStorage
_.info(`media storage: ${mode}`)
const client = require(`./${mode}_client`)

module.exports = async (container, path, id, filename) => {
  const url = await client.putImage(container, path, filename)
  _.log(url, 'new image url')
  return { id, url }
}
