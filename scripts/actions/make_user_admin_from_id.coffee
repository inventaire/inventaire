#!/usr/bin/env coffee
# require it before overriding the config
actionByUserId = require './lib/action_by_user_id'
CONFIG = require('./lib/get_custom_config')()
__ = CONFIG.universalPath
user_ = __.require 'lib', 'user/user'
actionByUserId user_.makeUserAdmin
