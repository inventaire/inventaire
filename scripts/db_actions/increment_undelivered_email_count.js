#!/usr/bin/env node
// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const __ = require('config').universalPath
const { incrementUndeliveredMailCounter } = __.require('controllers', 'user/lib/user')
const actionByEmail = require('./lib/action_by_email')
actionByEmail(incrementUndeliveredMailCounter)
