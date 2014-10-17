CONFIG = require 'config'
_ = require './utils'
gravatar = require('gravatar')

db = require '../db'
H = db: require '../lib/db'
usersDB = db.use CONFIG.db.users
Q = require 'q'
qreq = require 'qreq'

usersCot = require('../cotDb').users

module.exports =
  db: usersCot
  isLoggedIn: (req)->
    if req.session.email?
      _.logGreen req.session.toJSON(), 'user is logged in'
      return true
    else
      _.logRed req.session.toJSON(), 'user is not logged in'
      return false

  verifyAssertion: (req)->
    console.log 'verifyAssertion'
    params =
      url: "https://verifier.login.persona.org/verify"
      json:
        assertion: req.body.assertion
        audience: CONFIG.fullHost()
    _.logYellow params.json.audience, 'persona audience requested'
    return qreq.post params

  verifyStatus: (personaAnswer, req, res) ->
    _.logYellow personaAnswer.body, 'personaAnswer.body'
    body = personaAnswer.body
    req.session.username = username = req.body.username
    req.session.email = email = body.email

    if body.status is "okay"
      # CHECK IF EMAIL IS IN DB
      @byEmail(email)
      .then (body)=>
        if body.rows[0]
          # IF EMAIL IS ALREADY STORED IN DB, RETURN USER EMAIL AND USERNAME
          user = cleanUserData body.rows[0].value
          res.cookie "email", email
          res.json user
        else if username? and @nameIsValid username
          # IF EMAIL IS NOT IN DB AND IF VALID USERNAME, CREATE USER
          @newUser(username, email)
          .then (body)=>
            res.cookie "email", email
            res.json body
          .fail (err)-> _.errorHandler res, err
        else
          err = "Couldn't find an account associated with this email"
          _.logRed err
          _.errorHandler res, err
      .fail (err)-> _.errorHandler res, err
      .done()

    else
      _.errorHandler res, 'Persona verify status isnt okay oO: might be a problem with Persona audience setting'

  byId: (id)->
    return usersCot.get(id)

  byEmail: (email)->
    return usersCot.view "users", "byEmail", {key: email}

  nameIsValid: (username)->
    /^\w{1,20}$/.test username

  nameIsAvailable: (username)->
    deferred = Q.defer()
    unless @isReservedWord(username)
      @byUsername(username)
      .then (body)->
        if body.rows.length == 0
          _.logGreen username, 'available'
          deferred.resolve username
        else
          _.logRed username, 'not available'
          deferred.reject new Error('This username already exists')
    else
      _.logRed username, 'reserved word'
      deferred.reject new Error('Reserved words cant be usernames')
    return deferred.promise

  byUsername: (username)->
    return @db.view 'users', 'byUsername', {key: username.toLowerCase()}

  getSafeUserFromUsername: (username)->
    @byUsername(username)
    .then (res)=>
      if res?.rows?[0]?
        return @safeUserData(res.rows[0].value)
      else return
    .fail (err)->
      _.logRed err, 'couldnt getUserFromUsername'

  usernameStartBy: (username, options)->
    username = username.toLowerCase()
    query =
      startkey: username
      endkey: username + 'Z'
    query.limit = options.limit if options? and options.limit?
    return @db.view 'users', 'byUsername', query

  newUser: (username, email)->
    user =
      username: username
      email: email
      created: _.now()
      picture: gravatar.url(email, {d: 'mm', s: '200'}) # default, size
    _.logBlue user, 'new user'
    return usersCot.post(user).then (user)-> usersCot.get(user.id)

  getUsername: (email)->
    deferred = Q.defer()
    @byEmail(email)
    .then (res)->
      if res?.rows?[0]?
        deferred.resolve res.rows[0].value.username
      else deferred.resolve
    .fail (err)-> deferred.reject new Error(err)
    return deferred.promise

  getUserId: (email)->
    deferred = Q.defer()
    @byEmail(email)
    .then (res)->
      if res?.rows?[0]?
        deferred.resolve res.rows[0].value._id
      else deferred.resolve
    .fail (err)-> deferred.reject new Error(err)
    return deferred.promise

  fetchUsers: (ids)->
    deferred = Q.defer()
    if ids?.length? and ids.length > 0
      _.logGreen ids, 'ids for fetchUsers'
      usersDB.fetch {keys: ids}, (err, body)->
        if err then deferred.reject new Error(err)
        else deferred.resolve body
    else deferred.resolve()
    return deferred.promise


  getUsersPublicData: (ids)->
    ids = ids.split?('|') or ids
    @fetchUsers(ids)
    .then (body)=>
      _.logGreen body, 'found users data'
      if body?
        usersData = _.mapCouchResult 'doc', body
        _.logGreen usersData, 'usersData before cleaning'
        cleanedUsersData = usersData.map @safeUserData
        _.logGreen cleanedUsersData, 'cleanedUsersData'
        return cleanedUsersData
      else
        _.logYellow "users not found. Ids?: #{ids.join(', ')}"
        return

  safeUserData: (value)->
      _id: value._id
      username: value.username
      created: value.created
      picture: value.picture
      # contacts: value.contacts

  # only used by tests so far
  deleteUser: (user)->
    return usersCot.delete user._id, user._rev

  deleteUserByUsername: (username)->
    _.logBlue username, 'deleteUserbyUsername'
    @byUsername(username)
    .then (body)->
      return body.rows[0].value
    .then @deleteUser
    .fail (err)-> _.logRed err, 'deleteUserbyUsername err'

  isReservedWord: (username)->
    reservedWords = [
      'api'
      'entity'
      'entities'
      'inventory'
      'inventories'
      'wd'
      'wikidata'
      'isbn'
      'user'
      'users'
      'profil'
      'profile'
      'item'
      'items'
      'auth'
      'listings'
      'contacts'
      'contact'
      'welcome'
    ]
    return _.hasValue reservedWords, username


cleanUserData = (value)->
  if value.username? and value.email? and value.created? and value.picture?
    user =
      username: value.username
      email: value.email
      created: value.created
      picture: value.picture
    return user
  else
    throw new Error('missing user data')
