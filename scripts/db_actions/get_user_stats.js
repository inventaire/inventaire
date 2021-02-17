#!/usr/bin/env node
const __ = require('config').universalPath
const getUserStats = __.require('controllers', 'user/lib/get_user_stats')
const actionByUserId = require('./lib/action_by_user_id')
actionByUserId(getUserStats)
