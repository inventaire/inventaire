#!/usr/bin/env tsx
import { findUserByUsername } from '#controllers/user/lib/user'
import { updateUserRole } from '#scripts/db_actions/lib/roles'

const [ username, action, role ] = process.argv.slice(2)

const { _id: userId } = await findUserByUsername(username)

await updateUserRole(action, userId, role)
