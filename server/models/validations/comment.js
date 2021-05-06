// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { pass, userId, transactionId } = require('./common')

module.exports = {
  pass,
  userId,
  transactionId,
  message: message => message.length > 0 && message.length < 5000
}
