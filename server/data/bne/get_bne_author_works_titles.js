// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const fetchExternalAuthorWorksTitles = require('data/lib/fetch_external_author_works_titles')

const endpoint = 'http://datos.bne.es/sparql'

const getQuery = bneId => `SELECT ?work ?title WHERE {
<http://datos.bne.es/resource/${bneId}> <http://datos.bne.es/def/OP5001> ?work .
?work <http://datos.bne.es/def/P1001> ?title .
}`

module.exports = fetchExternalAuthorWorksTitles('bne', endpoint, getQuery)
