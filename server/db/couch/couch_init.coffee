CONFIG = require 'config'
fs = require 'fs'
__ = CONFIG.root
_ = __.require('builders', 'utils')


# cant use users and inventory cot-db as it would create a require loop
breq = require 'breq'

usersDesignDoc =
  name: 'users'
  id: '_design/users'
  path: __.path 'couchdb', 'users.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

itemsDesignDoc =
  name: 'items'
  id: '_design/items'
  path: __.path 'couchdb', 'items.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

baseDbUrl = CONFIG.db.fullHost()
usersDbUrl = baseDbUrl + '/' + CONFIG.db.users
invDbUrl = baseDbUrl + '/' + CONFIG.db.inventory

module.exports.usersDesignLoader = ->
  _.info 'usersDesignLoader'
  loader usersDbUrl, usersDesignDoc

module.exports.invDesignLoader = ->
  _.info 'invDesignLoader'
  loader invDbUrl, itemsDesignDoc

loader = (dbUrl, designDoc)->
  breq.post dbUrl, designDoc.body()
  .then (res)-> _.success res.body, "#{designDoc.id} for #{dbUrl}"
  .catch (err)-> _.error err.body or err, "#{designDoc.id} for #{dbUrl}"

module.exports.usersDesignUpdater = ->
  _.info 'usersDesignUpdater'
  updater usersDbUrl, usersDesignDoc

module.exports.invDesignUpdater = ->
  _.info 'invDesignUpdater'
  updater invDbUrl, itemsDesignDoc

updater = (dbUrl, designDoc)->
  breq.get dbUrl + '/' + designDoc.id
  .then (res)->
    _.log res.body, 'current'
    update = designDoc.body()
    update._rev = res.body._rev
    url = dbUrl + '/' + update._id
    breq.put(url, update)
    .then (res)-> _.success res.body, "#{designDoc.id} for #{dbUrl}"
  .catch (err)-> _.error err.body or err, "#{designDoc.id} for #{dbUrl}"

module.exports.loadFakeUsers = ->
  [
    'bobby', 'tony', 'luigi', 'rocky', 'shanapaul', 'Hubert_Bonisseur_de_la_Bath'
    'bambi', 'bartolome', 'boris', 'bastogne', 'baraka'
    'babidi', 'boo', 'bamboo', 'baratin'
  ]
  .forEach loadFakeUser
  # keepUsers.body().forEach putUser
  loadFakeUser() for [1..50]

keepUsers =
  path: __.path 'couchdb', 'keep_users.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

loadFakeUser = (username)->
  breq.get('http://api.randomuser.me/')
  .then (res)->
    fake = res.body.results[0].user
    userData =
      username: username or fake.username
      email: fake.email
      picture: fake.picture.medium
      created: _.now()
    postUser userData
  .catch (err)-> _.error err
  .done()

postUser = (data)->
  breq.post usersDbUrl, data
  .then (res)-> _.info res.body, 'postUser'
  .catch (err)-> _.error err, 'postUser'
  .done()

putUser = (data)->
  breq.put usersDbUrl + '/' + data._id, data
  .then (res)-> _.info res.body, 'putUser'
  .catch (err)-> _.error err, 'putUser'
  .done()