module.exports = couch_ = {}

couch_.mapResult = (res, type)-> res.rows.map (row)-> row[type]
couch_.mapDoc = (res)-> couch_.mapResult res, 'doc'
couch_.mapValue = (res)-> res.rows.map (row)-> row.value
couch_.mapValueId = (res)-> res.rows.map (row)-> row.value._id

couch_.firstDoc = (docs)-> docs?[0]

couch_.joinOrderedIds = (idA, idB)->
  if idA < idB then "#{idA}:#{idB}"
  else "#{idB}:#{idA}"

couch_.ignoreNotFound = (err)->
  if err?.error is 'not_found' then return

couch_.getObjIfSuccess = (db, body)->
  if db.get? and body.ok
    return db.get(body.id)
  else if db.get?
    throw new Error "#{body.error}: #{body.reason}"
  else
    throw new Error "bad db object passed to _.getObjIfSuccess"