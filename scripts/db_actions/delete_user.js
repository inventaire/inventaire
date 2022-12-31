#!/usr/bin/env nodeimport 'module-alias/register';
import deleteUserAndCleanup from 'controllers/user/lib/delete_user_and_cleanup'
import actionByUserId from './lib/action_by_user_id'
actionByUserId(deleteUserAndCleanup)
