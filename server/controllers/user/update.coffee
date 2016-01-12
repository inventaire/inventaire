__ = require('config').universalPath
_ = __.require 'builders', 'utils'

{ attributes, tests } = __.require 'models', 'user'
{ updatable, concurrencial } = attributes
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'
parse = __.require('lib', 'parsers')('user')
{ basicUpdater } = __.require 'lib', 'doc_updates'
emailUpdater = require('./lib/email_updater')(user_)

module.exports = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  { user, body } = req
  { attribute, value } = body

  unless _.isNonEmptyString attribute
    return error_.bundle res, 'missing attribute', 400
  unless value?
    return error_.bundle res, 'missing value', 400

  # doesnt change anything for normal attribute
  # returns the root object for deep attributes such as settings
  rootAttribute = attribute.split('.')[0]

  try value = parse rootAttribute, value
  catch err then return error_.bundle res, "value couldn't be parsed", 400

  # support deep objects
  currentValue = _.get user, attribute

  if value is currentValue
    return error_.bundle res, 'already up-to-date', 400

  if attribute isnt rootAttribute
    unless tests.deepAttributesExistance attribute
      return error_.bundle res, "invalid deep attribute #{attribute}: #{value}", 400

  if rootAttribute in updatable
    unless _.get(tests, rootAttribute)(value)
      type = _.typeOf value
      return error_.bundle res, "invalid #{attribute}: #{value} (#{type})", 400

    return updateAttribute(user, rootAttribute, attribute, value)
    .then _.Ok(res)
    .catch error_.Handler(res)

  if attribute in concurrencial
    # checks for validity and availability (+ reserve words for username)
    return user_.availability[attribute](value, currentValue)
    .then _.Full(updateAttribute, null, user, rootAttribute, attribute, value)
    .then _.Ok(res)
    .catch error_.Handler(res)

  error_.bundle res, "forbidden update: #{attribute} - #{value}", 403

updateAttribute = (user, rootAttribute, attribute, value)->
  updater = switch rootAttribute
    when 'email' then emailUpdater
    else basicUpdater

  user_.db.update user._id, updater.bind(null, attribute, value)
