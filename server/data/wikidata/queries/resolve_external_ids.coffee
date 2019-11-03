module.exports =
  parameters: [ 'externalIds' ]
  query: (params)-> buildQuery params.externalIds

buildQuery = (externalIds)->
  body = buildBody externalIds
  return "SELECT DISTINCT ?work WHERE { #{body} }"

buildBody = (externalIds)->
  if externalIds.length is 1 then return buildTriple externalIds[0]

  unions = externalIds
    .map buildTriple
    .join ' } UNION { '

  return "{ #{unions} }"

buildTriple = (pair)->
  [ prop, value ] = pair
  return "?work #{prop} '#{value}'"
