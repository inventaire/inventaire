// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const transporter_ = require('./transporter')
const buildTransactionEmail = require('./build_transaction_email')
const { catchDisabledEmails } = require('./helpers')

module.exports = {
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
