CONFIG = require 'config'
__ = CONFIG.universalPath
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
  body: -> require @path

loadFakeUser = (username)->
  bluereq.get('http://api.randomuser.me/')
  .then getUserData.bind(null, username)
  .then postUser
  .catch _.Error('loadFakeUser')

getUserData = (username, res)->
  fake = res.body.results[0].user
  return userData =
    username: username or fake.username
    email: fake.email
    picture: fake.picture.medium
    created: Date.now()

postUser = (data)->
  bluereq.post usersDbUrl, data
  .then (res)-> _.info res.body, 'postUser'
  .catch _.Error('postUser')