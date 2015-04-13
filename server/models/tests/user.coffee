CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

{ userId, username, email } = require './common-tests'

module.exports =
  userId: userId
  username: username
  email: email
  password: (password)->  8 <= password.length <=60
  # accepting second level languages (like es-AR) but only using first level yet
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
  picture: (picture)-> _.isUrl(picture)
  creationStrategy: (creationStrategy)->
    creationStrategy in ['browserid', 'local']
  bio: (bio)-> _.isString(bio) and bio.length < 1000
