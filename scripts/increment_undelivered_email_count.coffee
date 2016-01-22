#!/usr/bin/env coffee

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

_.extend CONFIG.db,
  # force to use the Couchdb tunneled to the 3456 port
  port: 3456
  suffix: 'prod'
  unstable: false
  reloadDesignDocs: false

user_ = __.require 'lib', 'user/user'
tests = __.require 'models','tests/common-tests'

[ email ] = process.argv.slice 2

_.log email, 'email'

unless tests.email email
  throw new Error('invalid email')

user_.incrementUndeliveredMailCounter email
.then _.Log('OK')
.catch _.Error('err')
.then -> process.exit 0
