import parseUrl from 'parseurl'
import { getGroupBySlug, getGroupMembersIds } from '#controllers/groups/lib/groups'
import { findUserByUsername } from '#controllers/user/lib/user'
import { isUsername, isCouchUuid, isGroupId } from '#lib/boolean_validations'
import { notFoundError } from '#lib/error/error'
import { errorHandler } from '#lib/error/error_handler'
import { newInvalidError } from '#lib/error/pre_filled'

const extensionRedirect = extension => async (req, res) => {
  try {
    const { domain, id, section } = parseReqUrl(req, extension)
    const redirectionFn = redirections[extension][domain]

    if (redirectionFn == null) {
      throw newInvalidError('domain', domain)
    } else {
      const url = await redirectionFn(id, section)
      res.redirect(url)
    }
  } catch (err) {
    errorHandler(req, res, err)
  }
}

export default {
  json: extensionRedirect('json'),
  rss: extensionRedirect('rss'),
}

const extensionPatterns = {
  json: /\.json$/,
  rss: /\.rss$/,
}

function parseReqUrl (req, extension) {
  const { pathname } = parseUrl(req)
  let [ domain, id, section ] = pathname.split('/').slice(1)
  if (section) section = removeExtension(section, extension)
  else if (id) id = removeExtension(id, extension)
  return { domain, id, section }
}

function removeExtension (str, extension) {
  return str.replace(extensionPatterns[extension], '')
}

const isClaim = claim => /^(wdt:|invp:)/.test(claim)

async function usersRss (username) {
  const userId = await getUserId(username)
  return `/api/feeds?user=${userId}`
}

const redirections = {
  json: {
    entity: (uri, section) => {
      if (section) {
        if (section === 'history') {
          const [ prefix, id ] = uri.split(':')
          if (prefix === 'inv') {
            return `/api/entities?action=history&id=${id}`
          }
        }
        throw notFoundError({ uri, section })
      } else {
        // redirect claim uri to its entity value
        if (isClaim(uri)) uri = uri.split('-')[1]
        return `/api/entities?action=by-uris&uris=${uri}`
      }
    },
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
          throw notFoundError({ id, section })
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
          throw notFoundError({ id, section })
        }
      } else {
        if (isGroupId(id)) {
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
    groups: id => {
      if (isGroupId(id)) {
        return `/api/feeds?group=${id}`
      } else {
        const slug = id
        return getGroupBySlug(slug)
        .then(({ _id }) => `/api/feeds?group=${_id}`)
      }
    },
    shelves: id => `/api/feeds?shelf=${id}`,
    users: usersRss,
    // Legacy
    inventory: usersRss,
  },
}

async function getUserId (id) {
  if (isCouchUuid(id)) {
    return id
  } else {
    const { _id } = await findUserByUsername(id)
    return _id
  }
}

async function getGroupId (id) {
  if (isCouchUuid(id)) {
    return id
  } else {
    const { _id } = await getGroupBySlug(id)
    return _id
  }
}
