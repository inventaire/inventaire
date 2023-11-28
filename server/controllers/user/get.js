import { pick } from 'lodash-es'
import { setUserStableUsername } from '#controllers/user/lib/user'
import { ownerSafeData } from './lib/authorized_user_data_pickers.js'

const controller = async (params, req, res) => {
  // The logged in user as its document set on req.user by passport.js
  const userData = ownerSafeData(req.user)

  if (res.locals.scope != null) {
    const attributesShortlist = getAllowedAttributes(res.locals.scope)
    // In case there is an authorized request to a scope that includes
    // the 'stableUsername' attribute, that means that a service now relies
    // on the hypothesis that we will always return the same username for a given user
    // This behavior is tailored
    if (attributesShortlist.includes('stableUsername')) {
      await setUserStableUsername(userData)
    }
    return pick(userData, attributesShortlist)
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

export default { sanitization: {}, controller }
