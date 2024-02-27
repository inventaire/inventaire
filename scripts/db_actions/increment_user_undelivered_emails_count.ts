#!/usr/bin/env -S node --loader ts-node/esm --no-warnings
import { incrementUndeliveredMailCounter } from '#controllers/user/lib/user'
import actionByEmail from './lib/action_by_email.js'

actionByEmail(incrementUndeliveredMailCounter)
