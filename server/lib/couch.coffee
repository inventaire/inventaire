module.exports = couch_ = {}

couch_.mapResult = (res, type)-> res.rows.map (row)-> row[type]
couch_.mapDoc = (res)-> couch_.mapResult res, 'doc'
couch_.mapValueId = (res)-> res.rows.map (row)-> row.value._id

couch_.joinOrderedIds = (idA, idB)->
  if idA < idB then "#{idA}:#{idB}"
  else "#{idB}:#{idA}"

couch_.ignoreNotFound = (err)->
  if err?.error is 'not_found' then return

