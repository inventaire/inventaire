__ = require('config').universalPath
_ = __.require 'builders', 'utils'

User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'
updates_ = __.require 'lib', 'doc_updates'
{ valueAlreayUpToDate, basicUpdater, stringBooleanUpdater } = updates_

module.exports = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  { user, body } = req
  { attribute, value } = body

  # parsers are meant to reverse type changes occuring during data transfer
  # ex: numbers converted to strings
  # parsers are placed before tests to test only parsed values
  if attribute in haveParser
    value = parsers[attribute](value)

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
    .then _.Ok(res)
    .catch error_.Handler(res)

  if attribute in User.attributes.concurrencial
    # checks for validity and availability (+ reserve words for username)
    return user_.availability[attribute](value)
    .then updateAttribute.bind(null, user, rootAttribute, attribute, value)
    .then _.Ok(res)
    .catch error_.Handler(res)

  error_.bundle res, "forbidden update: #{attribute} - #{value}", 403

updateAttribute = (user, rootAttribute, attribute, value)->
  updater = switch rootAttribute
    when 'email' then emailUpdater
    when 'settings' then stringBooleanUpdater
    else basicUpdater
  user_.db.update user._id, updater.bind(null, attribute, value)

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

parsers =
  position: (latLng)->
    # allow the user to delete her position by passing a null value
    unless _.isArray latLng then return null
    return latLng.map (str)-> Number(str)

haveParser = Object.keys parsers
