import transporter_ from './transporter'
import buildTransactionEmail from './build_transaction_email'
import { catchDisabledEmails } from './helpers'

export default {
  transactionUpdate: async transactionId => {
    let email
    try {
      email = await buildTransactionEmail(transactionId)
    } catch (err) {
      catchDisabledEmails(err)
    }

    if (!email) return

    return transporter_.sendMail(email)
  }
}
