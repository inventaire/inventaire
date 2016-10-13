CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

couch_ = __.require 'lib', 'couch'
User = __.require 'models', 'user'
{ byEmail, byEmails, findOneByEmail } = require './shared_user_handlers'
{ publicUserData, publicUsersDataWithEmails } = require './public_user_data'

db = __.require('couch', 'base')('users', 'user')
geo = require('./geo/geo')()

user_ =
  db: db
  byId: db.get.bind(db)
  byIds: db.fetch.bind(db)
  byEmail: byEmail.bind(null, db)
  byEmails: byEmails.bind(null, db)
  findOneByEmail: findOneByEmail.bind(null, db)

  publicUsersDataByEmails: (emails)->
    _.type emails, 'array'
    user_.byEmails emails
    # keeping the email is required to map the users returned
    # with the initial input
    .then publicUsersDataWithEmails

  byUsername: (username)->
    db.viewByKey 'byUsername', username.toLowerCase()

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

  getSafeUserFromUsername: (username)->
    user_.byUsername username
    .then (docs)->
      if docs?[0]? then return publicUserData docs[0]
      else return

  usernameStartBy: (username, options)->
    username = username.toLowerCase()
    params =
      startkey: username
      endkey: username + 'Z'
      include_docs: true
    params.limit = options.limit if options?.limit?
    db.viewCustom 'byUsername', params

  getUsersPublicData: (ids, format='collection')->
    ids = ids.split?('|') or ids
    unless ids.length > 0
      _.warn arguments, 'no ids provided at getUsersPublicData'
      emptyData = formatUsersData format, []
      return promises_.resolve emptyData

    user_.byIds ids
    .then (usersData)->
      unless usersData?
        _.warn ids, "users not found"
        return
      return usersData.map publicUserData

    .then formatUsersData.bind(null, format)

  incrementUndeliveredMailCounter: (email)->
    user_.findOneByEmail email
    .then (doc)->
      { _id } = doc
      db.update _id, (doc)->
        doc.undeliveredEmail or= 0
        doc.undeliveredEmail += 1
        return doc

  nearby: (userId, meterRange, strict)->
    user_.byId userId
    .then (user)->
      { position } = user
      console.log 'position', position
      unless position?
        throw error_.new 'user has no position set', 400, userId

      findNearby position, meterRange, null, strict
      .then _.Log('find nearby')
      .then (res)->
        ids = res.map _.property('id')
        return _.without ids, userId

    .catch _.ErrorRethrow('nearby err')

findNearby = (latLng, meterRange, iterations=0, strict=false)->
  _.log arguments, 'findNearby iteration'
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
      return findNearby latLng, meterRange*2, iterations


formatUsersData = (format, usersData)->
  if format is 'index' then return _.indexBy usersData, '_id'
  else return usersData

token_ = require('./token')(db, user_)
user_.availability = availability_ = require('./availability')(user_)
user_.create = require('./create')(db, token_, availability_)
user_.byPosition = require('../by_position')(db, 'user')

deleteUser = require('./delete')(db, user_)
reqParsers = require './req_parsers'
relationsStatus = require './relations_status'
summary_ = require('./summary')(db)

module.exports = _.extend user_, token_, relationsStatus, reqParsers, deleteUser, summary_
