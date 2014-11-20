CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

Promise = require 'bluebird'
breq = require 'breq'

socialGraph = __.require 'graph', 'social_graph'

gravatar = require 'gravatar'

module.exports =
  db: __.require 'db', 'users'
  isLoggedIn: (req)->
    if req.session.email?
      _.success req.session.toJSON(), 'user is logged in'
      return true
    else
      _.error req.session.toJSON(), 'user is not logged in'
      return false

  verifyAssertion: (req)->
    console.log 'verifyAssertion'
    params =
      url: "https://verifier.login.persona.org/verify"
      json:
        assertion: req.body.assertion
        audience: CONFIG.fullHost()
    _.log params.json.audience, 'persona audience requested'
    return breq.post params

  verifyStatus: (personaAnswer, req, res) ->
    _.log personaAnswer.body, 'personaAnswer.body'
    body = personaAnswer.body
    req.session.username = username = req.body.username
    req.session.email = email = body.email

    if body.status is "okay"
      # CHECK IF EMAIL IS IN DB
      @byEmail(email)
      .then (body)=>
        if body.rows[0]
          # IF EMAIL IS ALREADY STORED IN DB, RETURN USER EMAIL AND USERNAME
          user = @cleanUserData body.rows[0].value
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
          _.error err
          _.errorHandler res, err
      .fail (err)-> _.errorHandler res, err
      .done()

    else
      err = 'Persona verify status isnt okay oO: might be a problem with Persona audience setting'
      _.errorHandler res, err

  byId: (id)-> @db.get(id)

  byEmail: (email)-> @db.view "users", "byEmail", {key: email}

  nameIsValid: (username)-> /^\w{1,20}$/.test username

  nameIsAvailable: (username)->
    unless @isReservedWord(username)
      return @byUsername(username)
      .then (body)->
        if body.rows.length == 0
          _.success username, 'available'
          return username
        else
          _.error username, 'not available'
          throw new Error('This username already exists')
    else
      _.error username, 'reserved word'

      # this seems ackward to reject before returning the promise
      def = Promise.defer()
      def.reject new Error('Reserved words cant be usernames')
      return def.promise

  byUsername: (username)->
    params = { key: username.toLowerCase() }
    return @db.view 'users', 'byUsername', params

  getSafeUserFromUsername: (username)->
    @byUsername(username)
    .then (res)=>
      if res?.rows?[0]?
        return @safeUserData(res.rows[0].value)
      else return
    .fail (err)->
      _.error err, 'couldnt getUserFromUsername'

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
      # gravatar params: {d: default, s: size}
      picture: gravatar.url(email, {d: 'mm', s: '200'})
    _.info user, 'new user'
    return @db.post(user).then (user)=> @db.get(user.id)

  getUserId: (email)->
    return @byEmail(email)
    .then (res)->
      if res?.rows?[0]? then return res.rows[0].value._id
      else return
    .fail (err)-> throw new Error(err)

  fetchUsers: (ids)-> @db.fetch(ids)

  getUsersPublicData: (ids, format='collection')->
    ids = ids.split?('|') or ids
    @fetchUsers(ids)
    .then (body)=>
      _.success body, 'found users data'

      if body?
        usersData = _.mapCouchDoc body
        _.success usersData, 'usersData before cleaning'
        cleanedUsersData = usersData.map @safeUserData

        if format is 'index'
          data = _.indexBy(cleanedUsersData, '_id')
          _.log data, 'usersData: index format'
        else
          data = cleanedUsersData
          _.log data, 'usersData: collection format'

        return data

      else
        _.log "users not found. Ids?: #{ids.join(', ')}"
        return

  safeUserData: (value)->
    _id: value._id
    username: value.username
    created: value.created
    picture: value.picture

  # only used by tests so far
  deleteUser: (user)-> @db.del user._id, user._rev

  deleteUserByUsername: (username)->
    _.info username, 'deleteUserbyUsername'
    @byUsername(username)
    .then (body)-> body.rows[0].value
    .then @deleteUser.bind @
    .fail (err)-> _.error err, 'deleteUserbyUsername err'

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
      'profil'
      'profile'
      'item'
      'items'
      'auth'
      'listings'
      'contacts'
      'contact'
      'user'
      'users'
      'friend'
      'friends'
      'welcome'
    ]
    return _.hasValue reservedWords, username

  getUserRelations: (userId)->
    # just proxiing to let this module centralize
    # interactions with the social graph
    socialGraph.getUserRelations(userId)


  cleanUserData: (value)->
    if value.username? and value.email? and value.created? and value.picture?
      user =
        username: value.username
        email: value.email
        created: value.created
        picture: value.picture
      return user
    else
      throw new Error('missing user data')