// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  parameters: [ 'externalIds' ],
  query(params){ return buildQuery(params.externalIds) }
}

var buildQuery = function(externalIds){
  const body = buildBody(externalIds)
  return `SELECT DISTINCT ?work WHERE { ${body} }`
}

var buildBody = function(externalIds){
  if (externalIds.length === 1) return buildTriple(externalIds[0])

  const unions = externalIds
    .map(buildTriple)
    .join(' } UNION { ')

  return `{ ${unions} }`
}

var buildTriple = function(pair){
  const [ prop, value ] = Array.from(pair)
  return `?work ${prop} '${value}'`
}
