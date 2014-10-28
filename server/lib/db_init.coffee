CONFIG = require 'config'
qreq = require 'qreq'
fs = require 'fs'
_ = CONFIG.root.require('builders', 'utils')

usersDesignDoc =
  name: 'users'
  id: '_design/users'
  path: './couchdb/users.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

itemsDesignDoc =
  name: 'items'
  id: '_design/items'
  path: './couchdb/items.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

baseDbUrl = CONFIG.db.fullHost()
usersDbUrl = baseDbUrl + '/' + CONFIG.db.users
invDbUrl = baseDbUrl + '/' + CONFIG.db.inv

module.exports.usersDesignLoader = ->
  _.logBlue 'usersDesignLoader'
  qreq.post usersDbUrl, usersDesignDoc.body()
  .then (res)-> _.logGreen res.body, "#{usersDesignDoc.id} for #{usersDbUrl}"
  .fail (err)-> _.logRed err.body, "#{usersDesignDoc.id} for #{usersDbUrl}"

module.exports.invDesignLoader = ->
  _.logBlue 'invDesignLoader'
  qreq.post invDbUrl, itemsDesignDoc.body()
  .then (res)-> _.logGreen res.body, "#{itemsDesignDoc.id} for #{invDbUrl}"
  .fail (err)-> _.logRed err.body, "#{itemsDesignDoc.id} for #{invDbUrl}"

module.exports.loadFakeUsers = ->
  [
    'bobby', 'tony', 'luigi', 'rocky', 'shanapaul', 'Hubert_Bonisseur_de_la_Bath'
    'bambi', 'bartolome', 'boris', 'bastogne', 'baraka'
    'babidi', 'boo', 'bamboo', 'baratin'
  ]
  .forEach loadFakeUser
  keepUsers.body().forEach putUser
  loadFakeUser() for [1..50]

keepUsers =
  path: './couchdb/keep_users.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

loadFakeUser = (username)->
  qreq.get('http://api.randomuser.me/')
  .then (res)->
    fake = res.body.results[0].user
    userData =
      username: username || fake.username
      email: fake.email
      picture: fake.picture
      created: _.now()
    postUser userData
  .fail (err)-> _.error err
  .done()

postUser = (data)->
  qreq.post usersDbUrl, data
  .then (res)-> _.logBlue res.body, 'postUser'
  .fail (err)-> _.error err, 'postUser'
  .done()

putUser = (data)->
  qreq.put usersDbUrl + '/' + data._id, data
  .then (res)-> _.logBlue res.body, 'putUser'
  .fail (err)-> _.error err, 'putUser'
  .done()