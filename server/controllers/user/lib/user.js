
let availability_
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')

const couch_ = __.require('lib', 'couch')
const User = __.require('models', 'user')
const { byEmail, byEmails, findOneByEmail } = require('./shared_user_handlers')
const { omitPrivateData } = require('./authorized_user_data_pickers')
const { BasicUpdater } = __.require('lib', 'doc_updates')

const db = __.require('couch', 'base')('users')
const geo = require('./geo/geo')()

const user_ = {
  db,
  byId: db.get,
  byIds: db.fetch,
  byEmail: byEmail.bind(null, db),
  byEmails: byEmails.bind(null, db),
  findOneByEmail: findOneByEmail.bind(null, db),

  getUsersByEmails: (emails, reqUserId) => {
    assert_.array(emails)
    // Keeping the email is required to map the users returned
    // with the initial input
    return user_.getUsersAuthorizedData(user_.byEmails(emails), reqUserId, 'email')
  },

  byUsername: username => db.viewByKey('byUsername', username.toLowerCase()),
  byUsernames: usernames => {
    return db.viewByKeys('byUsername', usernames.map(_.toLowerCase))
  },

  findOneByUsername: username => {
    return user_.byUsername(username)
    .then(couch_.firstDoc)
    .then(user => {
      // ignoring case as expected does the database
      if ((user != null ? user.username.toLowerCase() : undefined) === username.toLowerCase()) {
        return user
      } else {
        throw error_.notFound({ username })
      }
    })
  },

  findOneByUsernameOrEmail: str => {
    if (User.validations.email(str)) {
      return user_.findOneByEmail(str)
    } else {
      return user_.findOneByUsername(str)
    }
  },

  getUserFromUsername: (username, reqUserId) => {
    assert_.string(username)
    return user_.getUsersAuthorizedData(user_.byUsername(username), reqUserId)
    .then(usersDocs => {
      const userDoc = usersDocs[0]
      if (userDoc != null) {
        return userDoc
      } else {
        throw error_.notFound({ username })
      }
    })
  },

  getUserById: (id, reqUserId) => {
    assert_.string(id)
    return user_.getUsersAuthorizedData(user_.byIds([ id ]), reqUserId)
    .then(users => {
      const user = users[0]
      if (user != null) {
        return user
      } else {
        throw error_.notFound({ userId: id })
      }
    })
  },

  getUsersByIds: (ids, reqUserId) => {
    assert_.array(ids)
    if (ids.length === 0) return promises_.resolve([])
    return user_.getUsersAuthorizedData(user_.byIds(ids), reqUserId)
  },

  getUsersAuthorizedData: (usersDocsPromise, reqUserId, extraAttribute) => {
    return promises_.all([
      usersDocsPromise,
      user_.getNetworkIds(reqUserId)
    ])
    .spread((usersDocs, networkIds) => _.compact(usersDocs)
    .filter(user => user.type !== 'deletedUser')
    .map(omitPrivateData(reqUserId, networkIds, extraAttribute)))
  },

  getUsersIndexByIds: reqUserId => {
    return ids => user_.getUsersByIds(ids, reqUserId)
  .then(_.KeyBy('_id'))
  },

  getUsersIndexByUsernames: reqUserId => {
    return usernames => user_.getUsersAuthorizedData(user_.byUsernames(usernames), reqUserId)
  .then(users => users.reduce(indexByLowerCasedUsername, {}))
  },

  incrementUndeliveredMailCounter: email => {
    return user_.findOneByEmail(email)
    .then(doc => {
      const { _id } = doc
      return db.update(_id, doc => {
        if (!doc.undeliveredEmail) { doc.undeliveredEmail = 0 }
        doc.undeliveredEmail += 1
        return doc
      })
    })
  },

  makeUserAdmin: userId => db.update(userId, BasicUpdater('admin', true)),

  nearby: (userId, meterRange, strict) => {
    return user_.byId(userId)
    .then(user => {
      const { position } = user
      if (position == null) {
        throw error_.new('user has no position set', 400, userId)
      }

      return findNearby(position, meterRange, null, strict)
      .then(res => {
        const ids = res.map(_.property('id'))
        return _.without(ids, userId)
      })
    })
    .catch(_.ErrorRethrow('nearby err'))
  }
}

const findNearby = (latLng, meterRange, iterations = 0, strict = false) => geo.search(latLng, meterRange)
.then(res => {
  // Try to get the 10 closest (11 minus the main user)
  // If strict, don't augment the range, just return what was found;
  // else double the range
  // But stop after 10 iterations to avoid creating an infinit loop
  // if there are no users geolocated
  if ((res.length > 11) || strict || (iterations > 10)) {
    return res
  } else {
    iterations += 1
    return findNearby(latLng, meterRange * 2, iterations)
  }
})

const indexByLowerCasedUsername = (users, user) => {
  const lowercasedUsername = user.username.toLowerCase()
  users[lowercasedUsername] = user
  return users
}

const token_ = require('./token')(db, user_)

user_.updateEmail = (user, email) => {
  user = User.updateEmail(user, email)
  return db.put(user)
  // sendValidationEmail doesn't need to access the last _rev
  // so it's ok to pass the user as it was before the database was updated
  .then(() => token_.sendValidationEmail(user))
}

user_.setOauthTokens = (userId, provider, data) => db.update(userId, User.setOauthTokens(provider, data))

user_.availability = (availability_ = require('./availability')(user_))
user_.create = require('./create')(db, token_, availability_)
user_.byPosition = __.require('lib', 'by_position')(db, 'users')

const deleteUser = require('./delete')(db, user_)
const reqParsers = require('./req_parsers')
const relationsStatus = require('./relations_status')
const summary_ = require('./summary')(db)

module.exports = Object.assign(user_, token_, relationsStatus, reqParsers, deleteUser, summary_)
