const _ = require('builders/utils')
const { attributes, validations, formatters } = require('models/user')
const { updatable, concurrencial, acceptNullValue } = attributes
const updateEmail = require('controllers/user/lib/update_email')
const db = require('db/couchdb/base')('users')
const availability_ = require('controllers/user/lib/availability')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const { basicUpdater } = require('lib/doc_updates')
const { Track } = require('lib/track')
const { sanitize } = require('lib/sanitize/sanitize')
const radio = require('lib/radio')

const sanitization = {
  attribute: {},
  value: {
    canBeNull: true
  },
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(update(req.user))
  .then(responses_.Ok(res))
  .then(Track(req, [ 'user', 'update' ]))
  .catch(error_.Handler(req, res))
}

const update = user => async ({ attribute, value }) => {
  if (value == null && !acceptNullValue.includes(attribute)) {
    throw error_.newMissingBody('value')
  }

  // doesnt change anything for normal attribute
  // returns the root object for deep attributes such as settings
  const rootAttribute = attribute.split('.')[0]

  // support deep objects
  const currentValue = _.get(user, attribute)

  if (value === currentValue) {
    throw error_.new('already up-to-date', 400, { attribute, value })
  }

  if (attribute !== rootAttribute) {
    if (!validations.deepAttributesExistance(attribute)) {
      throw error_.newInvalid('attribute', attribute)
    }
  }

  if (formatters[attribute]) value = formatters[attribute](value)

  if (updatable.includes(rootAttribute)) {
    if (!_.get(validations, rootAttribute)(value)) {
      throw error_.newInvalid('value', value)
    }

    await updateAttribute(user, attribute, value)
    if (attribute === 'picture' && currentValue) {
      await radio.emit('image:needs:check', { container: 'users', url: currentValue })
    }
    return
  }

  if (concurrencial.includes(attribute)) {
    // checks for validity and availability (+ reserve words for username)
    await availability_[attribute](value, currentValue)
    await updateAttribute(user, attribute, value)
    return
  }

  throw error_.new(`forbidden update: ${attribute} - ${value}`, 403)
}

const updateAttribute = (user, attribute, value) => {
  if (attribute === 'email') {
    return updateEmail(user, value)
  } else {
    return db.update(user._id, basicUpdater.bind(null, attribute, value))
  }
}
