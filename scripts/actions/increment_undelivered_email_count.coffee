#!/usr/bin/env coffee
# require it before overriding the config
actionByEmail = require './lib/action_by_email'
__ = require('config').universalPath
user_ = __.require 'lib', 'user/user'
actionByEmail user_.incrementUndeliveredMailCounter
