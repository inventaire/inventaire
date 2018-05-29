__ = require('config').universalPath
_ = __.require 'builders', 'utils'

{ attributes, validations } = __.require 'models', 'user'
{ updatable, concurrencial, acceptNullValue } = attributes
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
{ basicUpdater } = __.require 'lib', 'doc_updates'
User = __.require 'models', 'user'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next)->
  unless req.user? then return error_.unauthorizedApiAccess req, res
  { user, body } = req
  { attribute, value } = body

  unless _.isNonEmptyString attribute
    return error_.bundleMissingBody req, res, 'attribute'

  if (attribute not in acceptNullValue) and (not value?)
    return error_.bundleMissingBody req, res, 'value'

  # doesnt change anything for normal attribute
  # returns the root object for deep attributes such as settings
  rootAttribute = attribute.split('.')[0]

  # support deep objects
  currentValue = _.get user, attribute

  if value is currentValue
    return error_.bundle req, res, 'already up-to-date', 400, { attribute, value }

  if attribute isnt rootAttribute
    unless validations.deepAttributesExistance attribute
      return error_.bundleInvalid req, res, 'attribute', attribute

  if rootAttribute in updatable
    unless _.get(validations, rootAttribute)(value)
      return error_.bundleInvalid req, res, 'value', value

    return updateAttribute user, attribute, value
    .then responses_.Ok(res)
    .then Track(req, ['user', 'update'])
    .catch error_.Handler(req, res)

  if attribute in concurrencial
    # checks for validity and availability (+ reserve words for username)
    return user_.availability[attribute](value, currentValue)
    .then -> updateAttribute user, attribute, value
    .then responses_.Ok(res)
    .then Track(req, ['user', 'update'])
    .catch error_.Handler(req, res)

  error_.bundle req, res, "forbidden update: #{attribute} - #{value}", 403

updateAttribute = (user, attribute, value)->
  if attribute is 'email'
    user_.updateEmail user, value
  else
    user_.db.update user._id, basicUpdater.bind(null, attribute, value)
