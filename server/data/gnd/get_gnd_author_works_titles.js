// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const fetchExternalAuthorWorksTitles = require('data/lib/fetch_external_author_works_titles')

// Unofficial endpoint
const endpoint = 'https://zbw.eu/beta/sparql/gnd/query'

const getQuery = gndId => `SELECT ?work ?title WHERE {
  ?work <https://d-nb.info/standards/elementset/gnd#firstAuthor> <https://d-nb.info/gnd/${gndId}> .
  ?work <https://d-nb.info/standards/elementset/gnd#preferredNameForTheWork> ?title .
}`

module.exports = fetchExternalAuthorWorksTitles('gnd', endpoint, getQuery)
