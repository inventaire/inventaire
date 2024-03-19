#!/usr/bin/env tsx
import { incrementUndeliveredMailCounter } from '#controllers/user/lib/user'
import actionByEmail from './lib/action_by_email.js'

actionByEmail(incrementUndeliveredMailCounter)
