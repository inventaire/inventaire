const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const user_ = __.require('controllers', 'user/lib/user')
const { ownerSafeData } = require('./lib/authorized_user_data_pickers')

module.exports = (req, res) => {
  getTailoredData(req, res)
  .then(res.json.bind(res))
  .catch(error_.Handler(req, res))
}

const getTailoredData = async (req, res) => {
  // The logged in user as its document set on req.user by passport.js
  const userData = ownerSafeData(req.user)

  if (res.locals.scope != null) {
    const attributesShortlist = getAllowedAttributes(res.locals.scope)
    // In case there is an authorized request to a scope that includes
    // the 'stableUsername' attribute, that means that a service now relies
    // on the hypothesis that we will always return the same username for a given user
    // This behavior is tailored
    if (attributesShortlist.includes('stableUsername')) {
      await user_.setStableUsername(userData)
    }
    return _.pick(userData, attributesShortlist)
  } else {
    return userData
  }
}

const getAllowedAttributes = scopeNames => {
  return scopeNames.map(scopeName => attributesByScope[scopeName])
}

const attributesByScope = {
  username: 'username',
  'stable-username': 'stableUsername',
  email: 'email',
}
