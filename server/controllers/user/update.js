const __ = require('config').universalPath
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

module.exports = (req, res) => {
  const { user, body } = req
  const { attribute } = body
  let { value } = body

  if (!_.isNonEmptyString(attribute)) {
    return error_.bundleMissingBody(req, res, 'attribute')
  }

  if (value == null && !acceptNullValue.includes(attribute)) {
    return error_.bundleMissingBody(req, res, 'value')
  }

  // doesnt change anything for normal attribute
  // returns the root object for deep attributes such as settings
  const rootAttribute = attribute.split('.')[0]

  // support deep objects
  const currentValue = _.get(user, attribute)

  if (value === currentValue) {
    return error_.bundle(req, res, 'already up-to-date', 400, { attribute, value })
  }

  if (attribute !== rootAttribute) {
    if (!validations.deepAttributesExistance(attribute)) {
      return error_.bundleInvalid(req, res, 'attribute', attribute)
    }
  }

  if (formatters[attribute]) value = formatters[attribute](value)

  if (updatable.includes(rootAttribute)) {
    if (!_.get(validations, rootAttribute)(value)) {
      return error_.bundleInvalid(req, res, 'value', value)
    }

    return updateAttribute(user, attribute, value)
    .then(responses_.Ok(res))
    .then(Track(req, [ 'user', 'update' ]))
    .catch(error_.Handler(req, res))
  }

  if (concurrencial.includes(attribute)) {
    // checks for validity and availability (+ reserve words for username)
    return availability_[attribute](value, currentValue)
    .then(() => updateAttribute(user, attribute, value))
    .then(responses_.Ok(res))
    .then(Track(req, [ 'user', 'update' ]))
    .catch(error_.Handler(req, res))
  }

  error_.bundle(req, res, `forbidden update: ${attribute} - ${value}`, 403)
}

const updateAttribute = (user, attribute, value) => {
  if (attribute === 'email') {
    return updateEmail(user, value)
  } else {
    return db.update(user._id, basicUpdater.bind(null, attribute, value))
  }
}
