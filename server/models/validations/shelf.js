// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { pass, BoundedString, userId } = require('./common')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  listing: listing => {
    return [ 'private', 'network', 'public' ].includes(listing)
  },
  owner: userId,
  name: BoundedString(0, 128)
}
