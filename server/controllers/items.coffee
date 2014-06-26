db = require '../db'
db.inventory = db.use 'inventory'
helpers = require '../helpers/items'

module.exports =
  fetch: (req, res, next) ->
    json = "{\"_id\":\"p0biAX\",\"title\":\"La Horde du Contrevent\",\"visibility\":\"private\",\"transactionMode\":\"none\",\"comment\":\"\",\"tags\":\"\",\"owner\":\"username\",\"created\":\"2014-06-25T16:02:31.827Z\",\"entity\":{\"uri\":null,\"title\":null,\"P31\":null},\"version\":{\"uri\":null},\"instance\":{\"uri\":null,\"comment\":null,\"owner\":null,\"state\":null,\"history\":{\"created\":null,\"transactions\":[]}}}"
    item = JSON.parse json
    # item.title = "La Horde du Contrevent"
    # item._id = "123123"
    # item.owner = "username"
    items = [item]
    res.setHeader('Content-Type', 'application/json')
    res.send JSON.stringify(items)

  post: (req, res, next) ->
    if helpers.isValidItem req.body
      console.log req.body
      res.status('201')
      res.end()

    res.status('400')
    res.end()
