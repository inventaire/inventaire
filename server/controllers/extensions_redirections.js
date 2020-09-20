const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const user_ = __.require('controllers', 'user/lib/user')
const groups_ = __.require('controllers', 'groups/lib/groups')

const extensionRedirect = extension => (req, res) => {
  const { domain, id } = parseUrl(req, extension)
  const redirectionFn = redirections[extension][domain]

  if (redirectionFn == null) {
    error_.bundleInvalid(req, res, 'domain', domain)
  } else {
    // redirectionFn might return a promise
    // thus using Promise.resolve allows to normalize the returned value
    Promise.resolve(redirectionFn(id))
    .then(url => res.redirect(url))
    .catch(_.Error('rssRedirection error'))
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
  let [ domain, id ] = pathname.split('/').slice(1)
  if (id) id = id.replace(extensionPatterns[extension], '')
  return { domain, id }
}

const redirections = {
  json: {
    entity: uri => `/api/entities?action=by-uris&uris=${uri}`,
    inventory: username => `/api/users?action=by-usernames&usernames=${username}`,
    users: id => `/api/users?action=by-ids&ids=${id}`,
    groups: id => {
      if (_.isGroupId(id)) {
        return `/api/groups?action=by-id&id=${id}`
      } else {
        return `/api/groups?action=by-slug&slug=${id}`
      }
    },
    items: id => `/api/items?action=by-ids&ids=${id}`,
    shelves: id => `/api/shelves?action=by-ids&ids=${id}`
    // transactions: id =>
  },

  rss: {
    users: id => `/api/feeds?user=${id}`,
    inventory: username => {
      return user_.findOneByUsername(username)
      .then(({ _id }) => _id)
      .then(userId => `/api/feeds?user=${userId}`)
    },
    groups: id => {
      if (_.isGroupId(id)) {
        return `/api/feeds?group=${id}`
      } else {
        const slug = id
        return groups_.bySlug(slug)
        .then(({ _id }) => `/api/feeds?group=${_id}`)
      }
    }
  }
}
