CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

couch_ = __.require 'lib', 'couch'
User = __.require 'models', 'user'
{ byEmail, byEmails, findOneByEmail } = require './shared_user_handlers'
{ omitPrivateData } = require './authorized_user_data_pickers'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

db = __.require('couch', 'base')('users')
geo = require('./geo/geo')()

user_ =
  db: db
  byId: db.get
  byIds: db.fetch
  byEmail: byEmail.bind(null, db)
  byEmails: byEmails.bind(null, db)
  findOneByEmail: findOneByEmail.bind(null, db)

  getUsersByEmails: (emails, reqUserId)->
    _.type emails, 'array'
    # Keeping the email is required to map the users returned
    # with the initial input
    user_.getUsersAuthorizedData user_.byEmails(emails), reqUserId, 'email'

  byUsername: (username)-> db.viewByKey 'byUsername', username.toLowerCase()
  byUsernames: (usernames)->
    db.viewByKeys 'byUsername', usernames.map(_.toLowerCase)

  findOneByUsername: (username)->
    user_.byUsername username
    .then couch_.firstDoc
    .then (user)->
      # ignoring case as expected does the database
      if user?.username.toLowerCase() is username.toLowerCase() then return user
      else throw new Error "user not found for username: #{username}"

  findOneByUsernameOrEmail: (str)->
    if User.tests.email(str) then user_.findOneByEmail str
    else user_.findOneByUsername(str)

  getUserFromUsername: (username, reqUserId)->
    user_.getUsersAuthorizedData user_.byUsername(username), reqUserId
    .then (usersDocs)->
      userDoc = usersDocs[0]
      if userDoc? then return userDoc
      else throw error_.new 'user not found', 404, username

  getUserById: (reqUserId, id)->
    user_.getUsersAuthorizedData user_.byIds([id]), reqUserId
    .get '0'

  getUsersByIds: (reqUserId, ids)->
    _.type ids, 'array'
    if ids.length is 0 then return promises_.resolve []
    user_.getUsersAuthorizedData user_.byIds(ids), reqUserId

  getUsersAuthorizedData: (usersDocsPromise, reqUserId, extraAttribute)->
    promises_.all [
      usersDocsPromise
      user_.getNetworkIds reqUserId
    ]
    .spread (usersDocs, networkIds)->
      _.compact usersDocs
      .filter (user)-> user.type isnt 'deletedUser'
      .map omitPrivateData(reqUserId, networkIds, extraAttribute)

  getUsersIndexByIds: (reqUserId)-> (ids)->
    user_.getUsersByIds reqUserId, ids
    .then _.IndexBy('_id')

  getUsersIndexByUsernames: (reqUserId)-> (usernames)->
    user_.getUsersAuthorizedData user_.byUsernames(usernames), reqUserId
    .then _.IndexBy('username')

  incrementUndeliveredMailCounter: (email)->
    user_.findOneByEmail email
    .then (doc)->
      { _id } = doc
      db.update _id, (doc)->
        doc.undeliveredEmail or= 0
        doc.undeliveredEmail += 1
        return doc

  makeUserAdmin: (userId)-> db.update userId, BasicUpdater('admin', true)

  nearby: (userId, meterRange, strict)->
    user_.byId userId
    .then (user)->
      { position } = user
      console.log 'position', position
      unless position?
        throw error_.new 'user has no position set', 400, userId

      findNearby position, meterRange, null, strict
      .then (res)->
        ids = res.map _.property('id')
        return _.without ids, userId

    .catch _.ErrorRethrow('nearby err')

findNearby = (latLng, meterRange, iterations = 0, strict = false)->
  geo.search latLng, meterRange
  .then (res)->
    # Try to get the 10 closest (11 minus the main user)
    # If strict, don't augment the range, just return what was found;
    # else double the range
    # But stop after 10 iterations to avoid creating an infinit loop
    # if there are no users geolocated
    if res.length > 11 or strict or iterations > 10 then return res
    else
      iterations += 1
      return findNearby latLng, meterRange * 2, iterations

token_ = require('./token')(db, user_)

user_.updateEmail = (user, email)->
  user = User.updateEmail user, email
  db.put user
  # sendValidationEmail doesn't need to access the last _rev
  # so it's ok to pass the user as it was before the database was updated
  .then -> token_.sendValidationEmail user

user_.setOauthTokens = (userId, provider, data)->
  db.update userId, User.setOauthTokens(provider, data)

user_.availability = availability_ = require('./availability')(user_)
user_.create = require('./create')(db, token_, availability_)
user_.byPosition = __.require('lib', 'by_position')(db, 'user')

deleteUser = require('./delete')(db, user_)
reqParsers = require './req_parsers'
relationsStatus = require './relations_status'
summary_ = require('./summary')(db)
require('./keep_snapshot_items_counts_updated')()

module.exports = _.extend user_, token_, relationsStatus, reqParsers, deleteUser, summary_
