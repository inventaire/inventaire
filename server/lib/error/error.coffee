__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'

module.exports = error_ = {}

# help bundling information at error instanciation
# so that it can be catched and parsed in a standardized way
# at the end of a promise chain, typically by a .catch error_.Handler(res)
error_.new = (message, filter, context...)->
  _.types [message, filter], ['string', 'string|number']

  err = new Error message
  # numbers filters are used as HTTP codes
  # while string will be taken as a type
  attribute = if _.isNumber(filter) then 'status' else 'type'
  err[attribute] = filter
  err.context = context
  return err

# same as error_.new but returns a promise
error_.reject = (args...)->
  err = error_.new.apply null, args
  return promises_.reject(err)


# allow to use the standard error_.new interface
# while out or at the end of a promise chain
# DO NOT use inside a promise chain as error_.handler
# send res, which, if there is an error, should be done by the final .catch
error_.bundle = (res, args...)->
  # first create the new error
  err = error_.new.apply null, args
  # then make the handler deal with the res object
  error_.handler res, err


error_.handler = errorHandler = require './error_handler'

# error_.handler with a binded res object
# to be used in final promise chains like so:
# .catch error_.Handler(res)
error_.Handler = (res)-> errorHandler.bind(null, res)
