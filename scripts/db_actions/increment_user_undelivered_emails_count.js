#!/usr/bin/env nodeimport 'module-alias/register';
import { incrementUndeliveredMailCounter } from 'controllers/user/lib/user'
import actionByEmail from './lib/action_by_email'
actionByEmail(incrementUndeliveredMailCounter)
