CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
bluereq = require 'bluereq'


module.exports = ->
  [
    'bobby', 'tony', 'luigi', 'rocky', 'shanapaul', 'Hubert_Bonisseur_de_la_Bath'
    'bambi', 'bartolome', 'boris', 'bastogne', 'baraka'
    'babidi', 'boo', 'bamboo', 'baratin'
  ]
  .forEach loadFakeUser
  loadFakeUser() for [1..50]

keepUsers =
  path: __.path 'couchdb', 'keep_users.json'
  body: -> _.jsonRead @path

loadFakeUser = (username)->
  bluereq.get('http://api.randomuser.me/')
  .then getUserData
  .then postUser
  .catch (err)-> _.error err

getUserData = (res)->
  fake = res.body.results[0].user
  return userData =
    username: username or fake.username
    email: fake.email
    picture: fake.picture.medium
    created: Date.now()

postUser = (data)->
  bluereq.post usersDbUrl, data
  .then (res)-> _.info res.body, 'postUser'
  .catch (err)-> _.error err, 'postUser'