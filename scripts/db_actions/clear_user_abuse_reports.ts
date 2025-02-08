#!/usr/bin/env tsx
import { clearUserAbuseReports } from '#controllers/user/lib/abuse_reports'
import actionByUserId from './lib/action_by_user_id.js'

actionByUserId(clearUserAbuseReports)
