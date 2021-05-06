// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { noCache } = require('config')
const pass = require('./pass')

let cacheControl
// Applies to both API and static files requests
if (noCache) {
  cacheControl = (req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    next()
  }
} else {
  cacheControl = pass
}

module.exports = { cacheControl }
