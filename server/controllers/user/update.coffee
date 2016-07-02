__ = require('config').universalPath
_ = __.require 'builders', 'utils'

{ attributes, tests } = __.require 'models', 'user'
{ updatable, concurrencial, acceptNullValue } = attributes
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'
{ basicUpdater } = __.require 'lib', 'doc_updates'
emailUpdater = require('./lib/email_updater')(user_)
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  { user, body } = req
  { attribute, value } = body

  unless _.isNonEmptyString attribute
    return error_.bundle req, res, 'missing attribute', 400

  if (attribute not in acceptNullValue) and (not value?)
    return error_.bundle req, res, 'missing value', 400

  # doesnt change anything for normal attribute
  # returns the root object for deep attributes such as settings
  rootAttribute = attribute.split('.')[0]

  # support deep objects
  currentValue = _.get user, attribute

  if value is currentValue
    return error_.bundle req, res, 'already up-to-date', 400

  if attribute isnt rootAttribute
    unless tests.deepAttributesExistance attribute
      message = "invalid deep attribute #{attribute}: #{value}"
      return error_.bundle req, res, message, 400

  if rootAttribute in updatable
    unless _.get(tests, rootAttribute)(value)
      type = _.typeOf value
      message = "invalid #{attribute}: #{value} (#{type})"
      return error_.bundle req, res, message, 400

    return updateAttribute(user, rootAttribute, attribute, value)
    .then _.Ok(res)
    .then Track(req, ['user', 'update'])
    .catch error_.Handler(req, res)

  if attribute in concurrencial
    # checks for validity and availability (+ reserve words for username)
    return user_.availability[attribute](value, currentValue)
    .then _.Full(updateAttribute, null, user, rootAttribute, attribute, value)
    .then _.Ok(res)
    .then Track(req, ['user', 'update'])
    .catch error_.Handler(req, res)

  error_.bundle req, res, "forbidden update: #{attribute} - #{value}", 403

updateAttribute = (user, rootAttribute, attribute, value)->
  updater = switch rootAttribute
    when 'email' then emailUpdater
    else basicUpdater

  user_.db.update user._id, updater.bind(null, attribute, value)
