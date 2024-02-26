#!/usr/bin/env ts-node
import { incrementUndeliveredMailCounter } from '#controllers/user/lib/user'
import actionByEmail from './lib/action_by_email.js'

actionByEmail(incrementUndeliveredMailCounter)
