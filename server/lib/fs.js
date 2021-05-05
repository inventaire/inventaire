// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { stat } = require('fs').promises
const { promisify } = require('util')
const mv = require('mv')

module.exports = {
  mv: promisify(mv),
  getContentLength: src => stat(src).then(({ size }) => size)
}
