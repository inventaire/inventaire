const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { attributes, validations, formatters } = __.require('models', 'user')
const { updatable, concurrencial, acceptNullValue } = attributes
const updateEmail = __.require('controllers', 'user/lib/update_email')
const db = __.require('db', 'couchdb/base')('users')
const availability_ = __.require('controllers', 'user/lib/availability')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const { basicUpdater } = __.require('lib', 'doc_updates')
const { Track } = __.require('lib', 'track')

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
