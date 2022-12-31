#!/usr/bin/env nodeimport 'module-alias/register';
import { stopEmails } from 'controllers/invitations/lib/invitations'
import actionByEmail from './lib/action_by_email'
actionByEmail(stopEmails)
