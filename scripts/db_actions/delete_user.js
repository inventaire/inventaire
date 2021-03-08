#!/usr/bin/env node
const __ = require('config').universalPath
const deleteUserAndCleanup = require('controllers/user/lib/delete_user_and_cleanup')
const actionByUserId = require('./lib/action_by_user_id')
actionByUserId(deleteUserAndCleanup)
