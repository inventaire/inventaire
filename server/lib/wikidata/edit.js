// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { userAgent } = require('lib/requests')

// Return an instance of wikibase-edit with the general config pre-set
module.exports = require('wikibase-edit')({
  instance: 'https://www.wikidata.org',
  userAgent,
  // Set an increased maxlag, as most edits are isolated edits from humans using the GUI
  maxlag: 10,
})
