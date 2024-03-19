import { log } from '#lib/utils/logs'
import validateObject from '#lib/validate_object'

const validEndpointKeys = [ 'get', 'post', 'put', 'delete', 'all' ]

// Basic validation of controllers objects to ease debugging
export const AddRoute = routes => (route, controllerObj) => {
  try {
    validateObject(controllerObj, validEndpointKeys, 'function')
  } catch (err) {
    log(route, 'endpoint validation failed', 'red')
    // Let the error crash Express to prevent the server from starting
    // and make clear something needs to be fixed
    throw err
  }

  routes[route] = controllerObj

  return controllerObj
}
