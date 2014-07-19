module.exports =
  path:
    server: (el)-> '../server/' + el
    controllers: (el)-> '../server/controllers/' + el
    models: (el)-> '../server/models/' + el
    helpers: (el)-> '../server/helpers/' + el
    client: (el)-> '../client/' + el
    app: (el)-> '../client/app/' + el
    clientLib: (el)-> '../client/app/lib/' + el
    couchdb: (el)-> 'couchdb/' + el