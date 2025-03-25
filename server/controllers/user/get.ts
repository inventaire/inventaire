import { pick } from 'lodash-es'
import { setUserStableUsername } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq, Res } from '#types/server'
import { ownerSafeData } from './lib/authorized_user_data_pickers.js'

async function controller (params: SanitizedParameters, req: AuthentifiedReq, res: Res) {
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

const attributesByScope = {
  username: 'username',
  'stable-username': 'stableUsername',
  email: 'email',
} as const

type Scope = keyof typeof attributesByScope

function getAllowedAttributes (scopeNames: Scope[]) {
  return scopeNames.map(scopeName => attributesByScope[scopeName])
}

export default { sanitization: {}, controller }
