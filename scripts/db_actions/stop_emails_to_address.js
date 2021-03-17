#!/usr/bin/env node
require('module-alias/register')
const { stopEmails } = require('controllers/invitations/lib/invitations')
const actionByEmail = require('./lib/action_by_email')
actionByEmail(stopEmails)
