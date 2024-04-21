export default {
  parameters: [ 'externalIds' ],
  query: params => buildQuery(params.externalIds),
  minimizable: true,
}

function buildQuery (externalIds) {
  const body = buildBody(externalIds)
  return `SELECT DISTINCT ?item WHERE { ${body} }`
}

function buildBody (externalIds) {
  if (externalIds.length === 1) return buildTriple(externalIds[0])

  const unions = externalIds
    .map(buildTriple)
    .join(' } UNION { ')

  return `{ ${unions} }`
}

const buildTriple = ([ prop, value ]) => `?item ${prop} '${value}'`
