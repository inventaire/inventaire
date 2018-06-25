#!/usr/bin/env coffee
CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ createUserWithItems } = require '../api_tests/fixtures/populate'

createUserWithItems()
.then (userCreated)->
  _.success '#### New User available ####'
  console.log "Your can now login with :\n\
    - Username : #{userCreated.username} \n\
    - Password : 12345678"
  process.exit 0
.catch _.Error err
