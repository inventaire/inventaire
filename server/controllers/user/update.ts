import { get } from 'lodash-es'
import { availability_ } from '#controllers/user/lib/availability'
import { checkSpamContent } from '#controllers/user/lib/spam'
import updateEmail from '#controllers/user/lib/update_email'
import { setUserStableUsername } from '#controllers/user/lib/user'
import { dbFactory } from '#db/couchdb/base'
import { basicUpdater } from '#lib/doc_updates'
import { newError } from '#lib/error/error'
import { newInvalidError, newMissingBodyError } from '#lib/error/pre_filled'
import { emit } from '#lib/radio'
import { assertString } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import userAttributes from '#models/attributes/user'
import { userFormatters } from '#models/user'
import userValidations from '#models/validations/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'
import type { User } from '#types/user'

const { updatable, concurrencial, acceptNullValue } = userAttributes
const db = await dbFactory('users')

const sanitization = {
  attribute: {},
  value: {
    canBeNull: true,
  },
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { attribute, value } = params
  const { user } = req
  if (attribute === 'bio') await checkSpamContent(user, value)
  await update(user, attribute, value)
  return { ok: true }
}

// This function update the document and should thus
// rather be in the User model, but async checks make it a bit hard
export async function update (user: User, attribute: string, value: unknown) {
  if (value == null && !arrayIncludes(acceptNullValue, attribute)) {
    throw newMissingBodyError('value')
  }

  // Doesn't change anything for normal attribute
  // returns the root object for deep attributes such as settings
  const rootAttribute = attribute.split('.')[0]

  // Support deep objects
  const currentValue = get(user, attribute)

  if (value === currentValue) {
    throw newError('already up-to-date', 400, { attribute, value })
  }

  if (attribute !== rootAttribute) {
    if (!userValidations.deepAttributesExistance(attribute)) {
      throw newInvalidError('attribute', attribute)
    }
  }

  if (userFormatters[attribute]) value = userFormatters[attribute](value)

  if (arrayIncludes(updatable, rootAttribute)) {
    if (!get(userValidations, rootAttribute)(value)) {
      throw newInvalidError('value', value)
    }

    await updateAttribute(user, attribute, value)
    if (attribute === 'picture' && currentValue) {
      await emit('image:needs:check', { url: currentValue, context: 'update' })
    }
    return
  }

  if (arrayIncludes(concurrencial, attribute)) {
    assertString(value)
    // Checks for validity and availability (+ reserve words for username)
    await availability_[attribute](value, currentValue)
    return updateAttribute(user, attribute, value)
  }

  throw newError('forbidden update', 403, { attribute, value })
}

async function updateAttribute (user, attribute, value) {
  if (attribute === 'email') {
    return updateEmail(user, value)
  } else {
    if (attribute === 'fediversable' || attribute === 'poolActivities') await setUserStableUsername(user)
    return db.update(user._id, basicUpdater.bind(null, attribute, value))
  }
}

export default {
  sanitization,
  controller,
  track: [ 'user', 'update' ],
}
