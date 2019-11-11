#!/usr/bin/env coffee
__ = require('config').universalPath
{ makeUserAdmin } = __.require 'controllers', 'user/lib/user'
actionByUserId = require './lib/action_by_user_id'
actionByUserId makeUserAdmin
