// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const { attributes, validations } = __.require('models', 'user')
const { updatable, concurrencial, acceptNullValue } = attributes
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const { basicUpdater } = __.require('lib', 'doc_updates')
const { Track } = __.require('lib', 'track')

module.exports = (req, res, next) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)
  const { user, body } = req
  const { attribute, value } = body

  if (!_.isNonEmptyString(attribute)) {
    return error_.bundleMissingBody(req, res, 'attribute')
  }

  if ((!acceptNullValue.includes(attribute)) && ((value == null))) {
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
    return user_.availability[attribute](value, currentValue)
    .then(() => updateAttribute(user, attribute, value))
    .then(responses_.Ok(res))
    .then(Track(req, [ 'user', 'update' ]))
    .catch(error_.Handler(req, res))
  }

  return error_.bundle(req, res, `forbidden update: ${attribute} - ${value}`, 403)
}

const updateAttribute = (user, attribute, value) => {
  if (attribute === 'email') {
    return user_.updateEmail(user, value)
  } else {
    return user_.db.update(user._id, basicUpdater.bind(null, attribute, value))
  }
}
