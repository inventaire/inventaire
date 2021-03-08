const CONFIG = require('config')
const __ = require('config').universalPath
const _ = require('builders/utils')
const requests_ = require('lib/requests')
const { host } = CONFIG.elasticsearch
const mappings = require('db/elasticsearch/mappings/mappings')
const settings = require('db/elasticsearch/settings/settings')

module.exports = async index => {
  const url = `${host}/${index}`
  const indexBaseName = index.split('-')[0]
  const indexMappings = mappings[indexBaseName]
  const body = { settings }
  if (indexMappings) body.mappings = indexMappings
  try {
    const res = await requests_.put(url, { body })
    _.success(res, `elasticsearch index created: ${url}`)
  } catch (err) {
    ignoreAlreadyExisting(url, err)
  }
}

const ignoreAlreadyExisting = (url, err) => {
  if (err.body && err.body.error.type === 'resource_already_exists_exception') {
    return _.warn(url, 'database already exist')
  } else {
    throw err
  }
}
