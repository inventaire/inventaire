CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'

publicUserData = (doc, extraAttribute)->
  attributes = getAttributes extraAttribute
  _.pick doc, attributes

getAttributes = (extraAttribute)->
  attributes = User.attributes.public.clone()
  # beware of map index passed as second argument
  if _.isString extraAttribute then attributes.push extraAttribute
  return attributes

publicUserDataWithEmail = (doc)-> publicUserData doc, 'email'

module.exports =
  publicUserData: publicUserData
  publicUsersData: (docs)-> docs.map publicUserData
  publicUsersDataWithEmails: (docs)-> docs.map publicUserDataWithEmail
