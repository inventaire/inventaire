// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const separatorPattern = /\W/

module.exports = {
  getLang: headers => {
    const acceptLanguage = headers['accept-language']
    if (acceptLanguage) return acceptLanguage.split(separatorPattern)[0]
  }
}
