const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { host } = CONFIG.elasticsearch

module.exports = dbName => {
  const url = `${host}/${dbName}`
  return requests_.put(url)
  .then(_.Log(`created: ${url}`))
  .catch(ignoreAlreadyExisting(url))
}

const ignoreAlreadyExisting = url => err => {
  if ((err.body != null ? err.body.error.type : undefined) === 'index_already_exists_exception') {
    return _.warn(url, 'database already exist')
  } else {
    throw err
  }
}
