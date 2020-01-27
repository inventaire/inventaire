const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const publicFolder = __.path('client', 'public')
const user_ = __.require('controllers', 'user/lib/user')
const groups_ = __.require('controllers', 'groups/lib/groups')

module.exports = {
  get: (req, res) => {
    const { pathname } = req._parsedUrl
    const domain = pathname.split('/')[1]
    if (domain === 'api') {
      error_.bundle(req, res, `GET ${pathname}: api route not found`, 404)
    } else if (domain === 'public') {
      error_.bundle(req, res, `GET ${pathname}: asset not found`, 404)
    } else if (imageHeader(req)) {
      const err = `GET ${pathname}: wrong content-type: ${req.headers.accept}`
      error_.bundle(req, res, err, 404)
    } else {
      // the routing will be done on the client side
      res.sendFile('./index.html', { root: publicFolder })
    }
  },

  jsonRedirection: (req, res) => {
    const { pathname } = req._parsedUrl
    let [ domain, id ] = pathname.split('/').slice(1)
    id = id && id.replace(/\.json$/, '')
    const redirectionFn = jsonRedirections[domain]

    if (redirectionFn == null) {
      error_.bundleInvalid(req, res, 'domain', domain)
    } else {
      res.redirect(redirectionFn(id))
    }
  },

  rssRedirection: (req, res) => {
    const { pathname } = req._parsedUrl
    let [ domain, id ] = pathname.split('/').slice(1)
    id = id && id.replace(/\.rss$/, '')
    const redirectionFn = rssRedirections[domain]

    if (redirectionFn == null) {
      error_.bundleInvalid(req, res, 'domain', domain)
    } else {
      // redirectionFn might return a promise
      // thus using Promise.resolve allows to normalize the returned value
      Promise.resolve(redirectionFn(id))
      .then(url => res.redirect(url))
      .catch(_.Error('rssRedirection error'))
    }
  },

  redirectToApiDoc: (req, res) => res.redirect('https://api.inventaire.io'),

  api: (req, res) => {
    error_.bundle(req, res, 'wrong API route or http verb', 404, {
      verb: req.method,
      url: req._parsedUrl.href
    })
  }
}

const imageHeader = req => /^image/.test(req.headers.accept)

const jsonRedirections = {
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
  items: id => `/api/items?action=by-ids&ids=${id}`
  // transactions: id =>
}

const rssRedirections = {
  users: id => `/api/feeds?user=${id}`,
  inventory: username => {
    return user_.findOneByUsername(username)
    .get('_id')
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
