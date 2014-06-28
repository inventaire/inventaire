H = items: require '../helpers/items'

module.exports =
  fetch: (req, res, next) ->
    H.items.fetchOwnerItems()
    .then (resp)->
      items = resp.rows.map (el)->el.doc
      res.setHeader 'Content-Type', 'application/json'
      res.status '200'
      res.send JSON.stringify(items)
    .done()

  post: (req, res, next) ->
    console.log "POST to be implemented!"
    # if H.items.isValidItem req.body
    #   H.items.postDocumentWithIdToInventoryDB req.body
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
    if H.items.isValidItem req.body
      H.items.putDocumentToInventoryDB req.body
      .then(
        res.status '201'
        res.end()
        )
      .done()
    else
      res.status '400'
      res.end()

  get: (req, res, next) ->
    console.log "****GET Item ID*******"
    console.log req.params.id
    console.log "**********************"
    H.items.getUniqueItem req.params.id
    .then (item)->
      res.status '200'
      res.send JSON.stringify(item)
    .done()