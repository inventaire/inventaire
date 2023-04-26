#!/usr/bin/env node
import { stopInvitationEmails } from '#controllers/invitations/lib/invitations'
import actionByEmail from './lib/action_by_email.js'

actionByEmail(stopInvitationEmails)
