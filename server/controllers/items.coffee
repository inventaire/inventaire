helpers = require '../helpers/items'

json = "{\"_id\":\"p0biAX\",\"title\":\"La Horde du Contrevent\",\"visibility\":\"private\",\"transactionMode\":\"none\",\"comment\":\"\",\"tags\":\"\",\"owner\":\"username\",\"created\":\"2014-06-25T16:02:31.827Z\",\"entity\":{\"uri\":null,\"title\":null,\"P31\":null},\"version\":{\"uri\":null},\"instance\":{\"uri\":null,\"comment\":null,\"owner\":null,\"state\":null,\"history\":{\"created\":null,\"transactions\":[]}}}"
fakeItem = JSON.parse json
items = [fakeItem]

module.exports =
  fetch: (req, res, next) ->
    res.setHeader('Content-Type', 'application/json')
    res.send JSON.stringify(items)

  post: (req, res, next) ->
    if helpers.isValidItem req.body
      helpers.postDocumentWithIdToInventoryDB req.body
      .then(
        res.status('201')
        res.end()
        )
    else
      res.status('400')
      res.end()

  put: (req, res, next) ->
    console.log "****Put Item ID*******"
    console.log req.params.id
    console.log "**********************"
    if helpers.isValidItem req.body
      helpers.postDocumentWithIdToInventoryDB req.body
      .then(
        res.status('201')
        res.end()
        )
    else
      res.status('400')
      res.end()