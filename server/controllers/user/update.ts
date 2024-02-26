import { get } from 'lodash-es'
import { availability_ } from '#controllers/user/lib/availability'
import updateEmail from '#controllers/user/lib/update_email'
import { setUserStableUsername } from '#controllers/user/lib/user'
import dbFactory from '#db/couchdb/base'
import { basicUpdater } from '#lib/doc_updates'
import { newError } from '#lib/error/error'
import { newInvalidError, newMissingBodyError } from '#lib/error/pre_filled'
import { emit } from '#lib/radio'
import User from '#models/user'

const { attributes, validations, formatters } = User

const { updatable, concurrencial, acceptNullValue } = attributes
const db = await dbFactory('users')

const sanitization = {
  attribute: {},
  value: {
    canBeNull: true,
  },
}

const controller = async (params, req) => {
  const { attribute, value } = params
  const { user } = req
  await update(user, attribute, value)
  return { ok: true }
}

// This function update the document and should thus
// rather be in the User model, but async checks make it a bit hard
const update = async (user, attribute, value) => {
  if (value == null && !acceptNullValue.includes(attribute)) {
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
    if (!validations.deepAttributesExistance(attribute)) {
      throw newInvalidError('attribute', attribute)
    }
  }

  if (formatters[attribute]) value = formatters[attribute](value)

  if (updatable.includes(rootAttribute)) {
    if (!get(validations, rootAttribute)(value)) {
      throw newInvalidError('value', value)
    }

    await updateAttribute(user, attribute, value)
    if (attribute === 'picture' && currentValue) {
      await emit('image:needs:check', { url: currentValue, context: 'update' })
    }
    return
  }

  if (concurrencial.includes(attribute)) {
    // Checks for validity and availability (+ reserve words for username)
    await availability_[attribute](value, currentValue)
    return updateAttribute(user, attribute, value)
  }

  throw newError('forbidden update', 403, { attribute, value })
}

const updateAttribute = async (user, attribute, value) => {
  if (attribute === 'email') {
    return updateEmail(user, value)
  } else {
    if (attribute === 'fediversable') await setUserStableUsername(user)
    return db.update(user._id, basicUpdater.bind(null, attribute, value))
  }
}

export default {
  sanitization,
  controller,
  track: [ 'user', 'update' ],
}
