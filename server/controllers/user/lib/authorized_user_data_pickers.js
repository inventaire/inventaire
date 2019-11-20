
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const User = __.require('models', 'user')

const ownerSafeData = user => {
  const safeUserDoc = _.pick(user, User.attributes.ownerSafe)
  safeUserDoc.oauth = (user.oauth != null) ? Object.keys(user.oauth) : []
  return safeUserDoc
}

module.exports = {
  ownerSafeData,
  // Adapts the result to the requester authorization level
  omitPrivateData: (reqUserId, networkIds, extraAttribute) => {
    const attributes = getAttributes(extraAttribute)
    return userDoc => {
      const userId = userDoc._id
      if (userId === reqUserId) return ownerSafeData(userDoc)

      userDoc = _.pick(userDoc, attributes)
      delete userDoc.snapshot.private

      if (networkIds.includes(userId)) return userDoc

      delete userDoc.snapshot.network
      return userDoc
    }
  }
}

const getAttributes = extraAttribute => {
  const attributes = User.attributes.public
  // Making sure we are not dealing with a map index accidently
  // passed as second argument.
  // Returning a different object
  if (_.isString(extraAttribute)) {
    return [ extraAttribute ].concat(attributes)
  } else {
    return attributes
  }
}
