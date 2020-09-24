const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host } = CONFIG.elasticsearch
const { mappingsList } = __.require('db', 'elasticsearch/list')

module.exports = async dbName => {
  const url = `${host}/${dbName}`
  const dbBaseName = dbName.split('-')[0]
  const indexMappings = mappingsList[dbBaseName]
  let body
  if (indexMappings) body = { mappings: indexMappings }
  try {
    const res = await requests_.put(url, { body })
    _.success(res, `elasticsearch index created: ${url}`)
  } catch (err) {
    ignoreAlreadyExisting(url, err)
  }
}

const ignoreAlreadyExisting = (url, err) => {
  if (err.body && err.body.error.type === 'index_already_exists_exception') {
    return _.warn(url, 'database already exist')
  } else {
    throw err
  }
}
