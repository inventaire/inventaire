#!/usr/bin/env node
const __ = require('config').universalPath
const { makeUserAdmin } = __.require('controllers', 'user/lib/user')
const actionByUserId = require('./lib/action_by_user_id')
actionByUserId(makeUserAdmin)
