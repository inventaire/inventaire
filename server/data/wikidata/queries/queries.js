// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const queries = {
  author_works: require('./author_works'),
  serie_parts: require('./serie_parts'),
  publisher_collections: require('./publisher_collections'),
  editions_reverse_claims: require('./editions_reverse_claims'),
  works_reverse_claims: require('./works_reverse_claims'),
  humans_reverse_claims: require('./humans_reverse_claims'),
  resolve_external_ids: require('./resolve_external_ids')
}

const queriesPerProperty = {}

for (const queryName in queries) {
  const { relationProperties } = queries[queryName]
  if (relationProperties) {
    relationProperties.forEach(property => {
      queriesPerProperty[property] = queriesPerProperty[property] || []
      queriesPerProperty[property].push(queryName)
    })
  }
}

module.exports = { queries, queriesPerProperty }
