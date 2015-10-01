__ = require('config').root
_ = __.require 'builders', 'utils'

User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  {attribute, value} = req.body
  {user} = req

  # support deep objects
  if valueAlreayUpToDate _.get(user, attribute), value
    return error_.bundle res, 'already up-to-date', 400

  # doesnt change anything for normal attribute
  # returns the root object for deep attributes such as settings
  rootAttribute = attribute.split('.')[0]

  if attribute isnt rootAttribute
    unless User.tests.deepAttributesExistance attribute
      return error_.bundle res, "invalid deep attribute #{attribute}: #{value}", 400

  if rootAttribute in User.attributes.updatable
    unless _.get(User.tests, rootAttribute)(value)
      return error_.bundle res, "invalid #{attribute}: #{value}", 400

    return updateAttribute(user, rootAttribute, attribute, value)
    .then updateConfirmation.bind(null, res)
    .catch error_.Handler(res)

  if attribute in User.attributes.concurrencial
    # checks for validity and availability (+ reserve words for username)
    return user_.availability[attribute](value)
    .then updateAttribute.bind(null, user, rootAttribute, attribute, value)
    .then updateConfirmation.bind(null, res)
    .catch error_.Handler(res)

  error_.bundle res, "forbidden update: #{attribute} - #{value}", 403


valueAlreayUpToDate = (currentValue, value)->
  if currentValue is value
    return true
  # booleans might arrive as string
  if _.isBoolean(currentValue) and value is currentValue.toString()
    return true
  return false

updateAttribute = (user, rootAttribute, attribute, value)->
  updater = switch rootAttribute
    when 'email' then emailUpdater
    when 'settings' then stringBooleanUpdater
    else commonUpdater
  user_.db.update user._id, updater.bind(null, attribute, value)

commonUpdater = (attribute, value, doc)->
  return _.set doc, attribute, value

stringBooleanUpdater = (attribute, value, doc)->
  # in the undesired cased that it is passed anything else
  # than a boolean string, it will default to true
  value = if value is 'false' then false else true
  return commonUpdater attribute, value, doc

emailUpdater = (attribute, value, doc)->
  doc = archivePreviousEmail(doc)
  doc.email = value
  # returns a user doc
  user_.sendValidationEmail(doc)

archivePreviousEmail = (doc)->
  if doc.validEmail
    doc.previousEmails or= []
    doc.previousEmails.push doc.email
    doc.previousEmails = _.uniq(doc.previousEmails)
    doc.validEmail = false
  return doc


updateConfirmation = (res, doc)->
  _.success doc, 'updateConfirmation'
  res.send('ok')