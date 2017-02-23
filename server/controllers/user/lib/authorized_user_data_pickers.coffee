CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'

module.exports =
  # Adapts the result to the requester authorization level
  omitPrivateData: (reqUserId, networkIds, extraAttribute)->
    attributes = getAttributes extraAttribute
    return (userDoc)->
      userId = userDoc._id
      if userId is reqUserId then return _.pick userDoc, User.attributes.ownerSafe

      userDoc = _.pick userDoc, attributes
      delete userDoc.snapshot.private

      if userId in networkIds then return userDoc

      delete userDoc.snapshot.network
      return userDoc

  ownerSafeData: (user)-> _.pick user, User.attributes.ownerSafe

getAttributes = (extraAttribute)->
  attributes = User.attributes.public
  # Making sure we are not dealing with a map index accidently
  # passed as second argument.
  # Returning a different object
  if _.isString extraAttribute then [ extraAttribute ].concat attributes
  else attributes
