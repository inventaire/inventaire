// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const coverBase = 'http://covers.openlibrary.org'

module.exports = {
  coverByOlId: (olId, type = 'b') => `${coverBase}/${type}/olid/${olId}.jpg`
}
