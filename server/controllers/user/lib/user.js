const _ = require('builders/utils')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const couch_ = require('lib/couch')
const User = require('models/user')
const { byEmail, byEmails, findOneByEmail } = require('./shared_user_handlers')
const { omitPrivateData } = require('./authorized_user_data_pickers')
const db = require('db/couchdb/base')('users')
const { getNetworkIds } = require('controllers/user/lib/relations_status')
const { defaultAvatar } = require('lib/assets')
const searchUsersByPosition = require('lib/search_by_position')(db, 'users')
const searchUsersByDistance = require('lib/search_by_distance')('users')

const user_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
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
      // Ignoring case as does the byUsername db view
      if (user && user.username.toLowerCase() === username.toLowerCase()) {
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
      if (userDoc) return userDoc
      else throw error_.notFound({ username })
    })
  },

  getUserById: (id, reqUserId) => {
    assert_.string(id)
    return user_.getUsersAuthorizedData(user_.byIds([ id ]), reqUserId)
    .then(users => {
      const user = users[0]
      if (user) return user
      else throw error_.notFound({ userId: id })
    })
  },

  getUsersByIds: async (ids, reqUserId) => {
    assert_.array(ids)
    if (ids.length === 0) return []
    return user_.getUsersAuthorizedData(user_.byIds(ids), reqUserId)
  },

  getUsersAuthorizedData: async (usersDocsPromise, reqUserId, extraAttribute) => {
    const [ usersDocs, networkIds ] = await Promise.all([
      usersDocsPromise,
      getNetworkIds(reqUserId)
    ])

    return usersDocs
    .map(omitPrivateData(reqUserId, networkIds, extraAttribute))
  },

  getUsersIndexByIds: (ids, reqUserId) => {
    return user_.getUsersByIds(ids, reqUserId)
    .then(_.KeyBy('_id'))
  },

  getUsersIndexByUsernames: async (reqUserId, usernames) => {
    const users = await user_.getUsersAuthorizedData(user_.byUsernames(usernames), reqUserId)
    const usersByLowercasedUsername = {}
    for (const user of users) {
      usersByLowercasedUsername[user.username.toLowerCase()] = user
    }
    return usersByLowercasedUsername
  },

  incrementUndeliveredMailCounter: email => {
    return user_.findOneByEmail(email)
    .then(doc => {
      const { _id } = doc
      return db.update(_id, doc => {
        if (doc.undeliveredEmail == null) doc.undeliveredEmail = 0
        doc.undeliveredEmail += 1
        return doc
      })
    })
  },

  addRole: (userId, role) => db.update(userId, User.addRole(role)),

  removeRole: (userId, role) => db.update(userId, User.removeRole(role)),

  setOauthTokens: (userId, provider, data) => {
    return db.update(userId, User.setOauthTokens(provider, data))
  },

  setStableUsername: async userData => {
    const { _id: userId, username, stableUsername } = userData
    if (stableUsername == null) {
      await db.update(userId, User.setStableUsername)
      userData.stableUsername = username
    }
    return userData
  },

  nearby: async (userId, meterRange, strict) => {
    const { position } = await user_.byId(userId)
    if (position == null) {
      throw error_.new('user has no position set', 400, userId)
    }
    const usersIds = await findNearby(position, meterRange, null, strict)
    return _.without(usersIds, userId)
  },

  byPosition: searchUsersByPosition,

  // View model serialization for emails and rss feeds templates
  serializeData: user => {
    user.picture = user.picture || defaultAvatar
    return user
  }
}

const findNearby = async (latLng, meterRange, iterations = 0, strict = false) => {
  const usersIds = await searchUsersByDistance(latLng, meterRange)
  // Try to get the 10 closest (11 minus the main user)
  // If strict, don't increase the range, just return what was found;
  // else double the range
  // But stop after 10 iterations to avoid creating an infinit loop
  // if there are no users geolocated
  if (usersIds.length > 11 || strict || iterations > 10) {
    return usersIds
  } else {
    iterations += 1
    return findNearby(latLng, meterRange * 2, iterations)
  }
}
