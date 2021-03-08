#!/usr/bin/env node
const __ = require('config').universalPath
const { stopEmails } = require('controllers/invitations/lib/invitations')
const actionByEmail = require('./lib/action_by_email')
actionByEmail(stopEmails)
