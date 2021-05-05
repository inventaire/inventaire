// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const leven = require('leven')

module.exports = (a, b) => {
  const averageLength = (a.length + b.length) / 2
  // If the Levenshtein distance between the two strings
  // is below a fourth of the average string length,
  // we consider the two strings to be quite close
  return leven(a.toLowerCase(), b.toLowerCase()) <= (averageLength / 4)
}
