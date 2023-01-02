#!/usr/bin/env node
import deleteUserAndCleanup from '#controllers/user/lib/delete_user_and_cleanup'
import actionByUserId from './lib/action_by_user_id.js'

actionByUserId(deleteUserAndCleanup)
