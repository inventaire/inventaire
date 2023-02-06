import { sendMail } from '#lib/emails/transporter'
import buildTransactionEmail from './build_transaction_email.js'
import { catchDisabledEmails } from './helpers.js'

export const debouncedEmailSenderByName = {
  transactionUpdate: async transactionId => {
    let email
    try {
      email = await buildTransactionEmail(transactionId)
    } catch (err) {
      catchDisabledEmails(err)
    }

    if (!email) return

    return sendMail(email)
  },
}
