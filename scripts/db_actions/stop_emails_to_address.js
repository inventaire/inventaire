#!/usr/bin/env node
// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const __ = require('config').universalPath
const { stopEmails } = __.require('controllers', 'invitations/lib/invitations')
const actionByEmail = require('./lib/action_by_email')
actionByEmail(stopEmails)
