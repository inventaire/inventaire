CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
pw_ = __.require('lib', 'crypto').passwords
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = Subscriber = {}

Subscriber.tests = tests = require './tests/subscriber'

Subscriber.create = (email, language)->
  tests.pass 'email', email

  # it's ok to have an undefined language
  if language? and not tests.language(language)
    throw error_.new "invalid language: #{language}", 400

  return subscriber =
    type: 'subscriber'
    email: email
    language: language
    created: _.now()