import { parseAddressList } from 'email-addresses'
import _ from '#builders/utils'
import { error_ } from '#lib/error/error'

// Takes a string (or an array) containing email addresses
// (typically, the value of a text input filled with emails by a user)
// and returns an array of parsed emails addresses
export default emails => {
  const emailsString = _.isArray(emails) ? emails.join(',') : emails

  if (!_.isNonEmptyString(emailsString)) {
    throw error_.newMissingBody('emails')
  }

  const parsedEmails = parseAddressList(prepareEmails(emailsString))

  if (parsedEmails == null) {
    throw error_.new("couldn't parse emails", 400, emails)
  }

  return _(parsedEmails)
  .map(_.property('address'))
  .map(_.toLowerCase)
  .uniq()
  .value()
}

// providing to 'email-addresses' known limitations
const prepareEmails = emails => {
  return emails.trim()
  // Replace line breaks, tabs, semi-colons by a comma
  .replace(/([\t\n;])/g, ',')
  // Replace successive commas
  .replaceAll(',,', ',')
  // Delete a possible trailing comma
  .replace(/,$/, '')
}
