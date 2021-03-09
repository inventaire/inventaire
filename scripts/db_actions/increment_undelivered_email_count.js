#!/usr/bin/env node
const { incrementUndeliveredMailCounter } = require('controllers/user/lib/user')
const actionByEmail = require('./lib/action_by_email')
actionByEmail(incrementUndeliveredMailCounter)
