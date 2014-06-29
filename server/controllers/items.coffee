inv = require '../helpers/inventoryDB'

module.exports =
  fetch: (req, res, next) ->
    inv.fetchOwnerItems()
    .then (resp)->
      items = resp.rows.map (el)->el.doc
      res.status '200'
      res.setHeader 'Content-Type', 'application/json'
      res.send JSON.stringify(items)
    .done()

  post: (req, res, next) ->
    console.log "POST to be implemented!"
    # if inv.isValidItem req.body
    #   inv.postDocumentWithIdToInventoryDB req.body
    #   .then(
    #     res.status('201')
    #     res.end()
    #     )
    # else
    #   res.status('400')
    #   res.end()

  put: (req, res, next) ->
    console.log "****Put Item ID*******"
    console.log req.params.id
    console.log "**********************"
    if inv.isValidItem req.body
      console.log "**********************"
      console.log req.body
      console.log "**********************"
      inv.putDocumentToInventoryDB req.body
      .then(
        res.status '201'
        res.send JSON.stringify(req.body)
        )
      .done()
    else
      res.status '400'
      res.end()

  get: (req, res, next) ->
    console.log "****GET Item ID*******"
    console.log req.params.id
    console.log "**********************"
    inv.getUniqueItem req.params.id
    .then (item)->
      res.status '200'
      res.setHeader 'Content-Type', 'application/json'
      res.send JSON.stringify(item)
    .done()

  del: (req, res, next) ->
    console.log "****DELETE Item ID*******"
    console.log req.params.id
    console.log "**********************"
    id = req.params.id
    inv.getItemRev id
    .then (rev)->
      console.log "**********************"
      console.log rev
      console.log "**********************"
      inv.deleteUniqueItem id, rev
    .then (body)->
      console.log "**********************"
      console.log body
      console.log "**********************"
      res.status '200'
      res.setHeader 'Content-Type', 'application/json'
      res.send JSON.stringify(body)
    .fail (err)->
      console.error 'ERROR' + err
      new Error err
      res.status '500'
      res.send err
    .done()
