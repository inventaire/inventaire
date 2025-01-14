#!/usr/bin/env tsx
import { updateUserRole } from '#scripts/db_actions/lib/roles'

const [ userId, action, role ] = process.argv.slice(2)

await updateUserRole(action, userId, role)
