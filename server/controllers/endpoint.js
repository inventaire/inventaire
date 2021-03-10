const _ = require('builders/utils')
const validateObject = require('lib/validate_object')
const validEndpointKeys = [ 'get', 'post', 'put', 'delete', 'all' ]

// Basic validation of controllers objects to ease debugging
module.exports = path => {
  const obj = require(`controllers/${path}`)

  try {
    validateObject(obj, validEndpointKeys, 'function')
  } catch (err) {
    _.log(path, 'endpoint validation failed', 'red')
    // Let the error crash Express to prevent the server from starting
    // and make clear something needs to be fixed
    throw err
  }

  return obj
}
