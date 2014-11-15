CONFIG = require 'config'
breq = require 'breq'
fs = require 'fs'
__ = CONFIG.root
_ = __.require('builders', 'utils')

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
invDbUrl = baseDbUrl + '/' + CONFIG.db.inv

module.exports.usersDesignLoader = ->
  _.info 'usersDesignLoader'
  breq.post usersDbUrl, usersDesignDoc.body()
  .then (res)-> _.success res.body, "#{usersDesignDoc.id} for #{usersDbUrl}"
  .fail (err)-> _.error err.body, "#{usersDesignDoc.id} for #{usersDbUrl}"

module.exports.invDesignLoader = ->
  _.info 'invDesignLoader'
  breq.post invDbUrl, itemsDesignDoc.body()
  .then (res)-> _.success res.body, "#{itemsDesignDoc.id} for #{invDbUrl}"
  .fail (err)-> _.error err.body, "#{itemsDesignDoc.id} for #{invDbUrl}"

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
      username: username || fake.username
      email: fake.email
      picture: fake.picture.medium
      created: _.now()
    postUser userData
  .fail (err)-> _.error err
  .done()

postUser = (data)->
  breq.post usersDbUrl, data
  .then (res)-> _.info res.body, 'postUser'
  .fail (err)-> _.error err, 'postUser'
  .done()

putUser = (data)->
  breq.put usersDbUrl + '/' + data._id, data
  .then (res)-> _.info res.body, 'putUser'
  .fail (err)-> _.error err, 'putUser'
  .done()