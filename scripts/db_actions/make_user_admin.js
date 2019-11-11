#!/usr/bin/env node
// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const __ = require('config').universalPath
const { makeUserAdmin } = __.require('controllers', 'user/lib/user')
const actionByUserId = require('./lib/action_by_user_id')
actionByUserId(makeUserAdmin)
