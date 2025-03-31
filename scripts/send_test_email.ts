#!/usr/bin/env tsx
import sendEmail from '#lib/emails/send_email'
import validations from '#models/validations/common'
import { logErrorAndExit, logSuccessAndExit } from '#scripts/scripts_utils'

const [ email ] = process.argv.slice(2)
if (!validations.email(email)) { throw new Error('invalid email') }

try {
  const res = await sendEmail.mailerTest(email)
  logSuccessAndExit('email might have been sent (see logs)', res)
} catch (err) {
  logErrorAndExit('could not send email', err)
}
