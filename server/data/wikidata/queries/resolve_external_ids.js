// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

module.exports = {
  parameters: [ 'externalIds' ],
  query: params => buildQuery(params.externalIds)
}

const buildQuery = externalIds => {
  const body = buildBody(externalIds)
  return `SELECT DISTINCT ?work WHERE { ${body} }`
}

const buildBody = externalIds => {
  if (externalIds.length === 1) return buildTriple(externalIds[0])

  const unions = externalIds
    .map(buildTriple)
    .join(' } UNION { ')

  return `{ ${unions} }`
}

const buildTriple = ([ prop, value ]) => `?work ${prop} '${value}'`
