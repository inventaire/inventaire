#!/usr/bin/env -S node --loader ts-node/esm --no-warnings
import { stopInvitationEmails } from '#controllers/invitations/lib/invitations'
import { stopAllUserEmailNotifications } from '#controllers/user/lib/user'
import { Log, warn } from '#lib/utils/logs'
import actionByEmail from './lib/action_by_email.js'

const ignore404 = label => err => {
  if (err.statusCode === 404) {
    warn(`${label} not found`)
  } else {
    throw err
  }
}

actionByEmail(async email => {
  await stopAllUserEmailNotifications(email)
  .then(Log('stopped user emails'))
  .catch(ignore404('user'))

  await stopInvitationEmails(email)
  .then(Log('stopped invitations emails'))
  .catch(ignore404('invitation'))
})
