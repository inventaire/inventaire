#!/usr/bin/env node
import { stopEmails } from '#controllers/invitations/lib/invitations'
import actionByEmail from './lib/action_by_email.js'

actionByEmail(stopEmails)
