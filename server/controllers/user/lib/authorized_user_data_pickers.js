CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
User = __.require 'models', 'user'

ownerSafeData = (user)->
  safeUserDoc = _.pick user, User.attributes.ownerSafe
  safeUserDoc.oauth = if user.oauth? then Object.keys(user.oauth) else []
  return safeUserDoc

module.exports =
  ownerSafeData: ownerSafeData
  # Adapts the result to the requester authorization level
  omitPrivateData: (reqUserId, networkIds, extraAttribute)->
    attributes = getAttributes extraAttribute
    return (userDoc)->
      userId = userDoc._id
      if userId is reqUserId then return ownerSafeData userDoc

      userDoc = _.pick userDoc, attributes
      delete userDoc.snapshot.private

      if userId in networkIds then return userDoc

      delete userDoc.snapshot.network
      return userDoc

getAttributes = (extraAttribute)->
  attributes = User.attributes.public
  # Making sure we are not dealing with a map index accidently
  # passed as second argument.
  # Returning a different object
  if _.isString extraAttribute then [ extraAttribute ].concat attributes
  else attributes
