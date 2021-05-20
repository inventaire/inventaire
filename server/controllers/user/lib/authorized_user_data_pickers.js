const _ = require('builders/utils')
const User = require('models/user')
const { getUserAccessLevels } = require('lib/get_user_access_levels')

const ownerSafeData = user => {
  const safeUserDoc = _.pick(user, User.attributes.ownerSafe)
  safeUserDoc.oauth = user.oauth ? Object.keys(user.oauth) : []
  safeUserDoc.roles = safeUserDoc.roles || []
  safeUserDoc.accessLevels = getUserAccessLevels(user)
  return safeUserDoc
}

module.exports = {
  ownerSafeData,

  // Adapts the result to the requester authorization level
  omitPrivateData: (reqUserId, networkIds, extraAttribute) => {
    const attributes = getAttributes(extraAttribute)
    return userDoc => {
      if (userDoc.type === 'deletedUser') return userDoc

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
