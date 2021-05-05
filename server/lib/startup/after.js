// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

module.exports = () => {
  // Run once the databases are ready to prevent having multiple error messages
  // if databases aren't properly setup
  require('lib/emails/mailer')()
}
