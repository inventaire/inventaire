const _ = require('builders/utils')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const groups_ = require('controllers/groups/lib/groups')
const { isUsername, isCouchUuid } = require('lib/boolean_validations')
const { getGroupMembersIds } = require('controllers/groups/lib/groups')

const extensionRedirect = extension => async (req, res) => {
  try {
    const { domain, id, section } = parseUrl(req, extension)
    const redirectionFn = redirections[extension][domain]

    if (redirectionFn == null) {
      throw error_.newInvalid('domain', domain)
    } else {
      const url = await redirectionFn(id, section)
      res.redirect(url)
    }
  } catch (err) {
    error_.handler(req, res, err)
  }
}

module.exports = {
  json: extensionRedirect('json'),
  rss: extensionRedirect('rss')
}

const extensionPatterns = {
  json: /\.json$/,
  rss: /\.rss$/
}

const parseUrl = (req, extension) => {
  const { pathname } = req._parsedUrl
  let [ domain, id, section ] = pathname.split('/').slice(1)
  if (section) section = removeExtension(section, extension)
  else if (id) id = removeExtension(id, extension)
  return { domain, id, section }
}

const removeExtension = (str, extension) => {
  return str.replace(extensionPatterns[extension], '')
}

const redirections = {
  json: {
    entity: uri => `/api/entities?action=by-uris&uris=${uri}`,
    inventory: username => `/api/users?action=by-usernames&usernames=${username}`,
    users: async (id, section) => {
      if (section) {
        const userId = await getUserId(id)
        if (section === 'inventory') {
          return `/api/items?action=by-users&users=${userId}&include-users=true`
        } else if (section === 'lists') {
          return `/api/lists?action=by-creators&users=${userId}`
        } else if (section === 'contributions') {
          return `/api/entities?action=contributions&user=${userId}`
        } else {
          throw error_.notFound({ id, section })
        }
      } else {
        if (isUsername(id)) {
          return `/api/users?action=by-usernames&usernames=${id}`
        } else {
          return `/api/users?action=by-ids&ids=${id}`
        }
      }
    },
    groups: async (id, section) => {
      if (section) {
        const groupId = await getGroupId(id)
        const usersIds = await getGroupMembersIds(groupId)
        if (section === 'inventory') {
          return `/api/items?action=by-users&users=${usersIds.join('|')}&filter=group&include-users=true`
        } else if (section === 'lists') {
          return `/api/lists?action=by-creators&users=${usersIds.join('|')}`
        } else {
          throw error_.notFound({ id, section })
        }
      } else {
        if (_.isGroupId(id)) {
          return `/api/groups?action=by-id&id=${id}`
        } else {
          return `/api/groups?action=by-slug&slug=${id}`
        }
      }
    },
    items: id => `/api/items?action=by-ids&ids=${id}`,
    shelves: id => `/api/shelves?action=by-ids&ids=${id}&with-items=true`,
    lists: id => `/api/lists?action=by-ids&ids=${id}&with-elements=true`,
    // transactions: id =>
  },

  rss: {
    users: id => `/api/feeds?user=${id}`,
    inventory: async username => {
      const userId = await getUserId(username)
      return `/api/feeds?user=${userId}`
    },
    groups: id => {
      if (_.isGroupId(id)) {
        return `/api/feeds?group=${id}`
      } else {
        const slug = id
        return groups_.bySlug(slug)
        .then(({ _id }) => `/api/feeds?group=${_id}`)
      }
    },
    shelves: id => `/api/feeds?shelf=${id}`,
  }
}

const getUserId = async id => {
  if (isCouchUuid(id)) {
    return id
  } else {
    const { _id } = await user_.findOneByUsername(id)
    return _id
  }
}

const getGroupId = async id => {
  if (isCouchUuid(id)) {
    return id
  } else {
    const { _id } = await groups_.bySlug(id)
    return _id
  }
}
