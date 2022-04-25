#!/usr/bin/env node
require('module-alias/register')
const { incrementUndeliveredMailCounter } = require('controllers/user/lib/user')
const actionByEmail = require('./lib/action_by_email')
actionByEmail(incrementUndeliveredMailCounter)
