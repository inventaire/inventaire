import emailAddresses from 'email-addresses'
import { chain, isArray, property } from 'lodash-es'
import { isNonEmptyString } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { newMissingBodyError } from '#lib/error/pre_filled'
import { toLowerCase } from '#lib/utils/base'
import type { Email } from '#types/user'

const { parseAddressList } = emailAddresses

// Takes a string (or an array) containing email addresses
// (typically, the value of a text input filled with emails by a user)
// and returns an array of parsed emails addresses
export function parseEmails (emails: string | string[]) {
  const emailsString = isArray(emails) ? emails.join(',') : emails

  if (!isNonEmptyString(emailsString)) {
    throw newMissingBodyError('emails')
  }

  const parsedEmails = parseAddressList(prepareEmails(emailsString))

  if (parsedEmails == null) {
    throw newError("couldn't parse emails", 400, { emails })
  }

  return chain(parsedEmails)
  .map(property('address'))
  .map(toLowerCase)
  .uniq()
  .value() as Email[]
}

// providing to 'email-addresses' known limitations
function prepareEmails (emails: string) {
  return emails.trim()
  // Replace line breaks, tabs, semi-colons by a comma
  .replace(/([\t\n;])/g, ',')
  // Replace successive commas
  .replaceAll(',,', ',')
  // Delete a possible trailing comma
  .replace(/,$/, '')
}
