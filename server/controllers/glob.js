/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const publicFolder = __.path('client', 'public')

module.exports = {
  get: (req, res) => {
    const { pathname } = req._parsedUrl
    const domain = pathname.split('/')[1]
    if (domain === 'api') {
      return error_.bundle(req, res, `GET ${pathname}: api route not found`, 404)
    } else if (domain === 'public') {
      return error_.bundle(req, res, `GET ${pathname}: asset not found`, 404)
    } else if (imageHeader(req)) {
      const err = `GET ${pathname}: wrong content-type: ${req.headers.accept}`
      return error_.bundle(req, res, err, 404)
    } else {
      // the routing will be done on the client side
      return res.sendFile('./index.html', { root: publicFolder })
    }
  },

  jsonRedirection: (req, res) => {
    const { pathname } = req._parsedUrl
    let [ domain, id ] = Array.from(pathname.split('/').slice(1))
    id = id != null ? id.replace(/\.json$/, '') : undefined
    const redirectionFn = redirections[domain]

    if (redirectionFn == null) {
      return error_.bundleInvalid(req, res, 'domain', domain)
    }

    return res.redirect(redirectionFn(id))
  },

  redirectToApiDoc: (req, res) => res.redirect('https://api.inventaire.io'),

  api: (req, res) => {
    return error_.bundle(req, res, 'wrong API route or http verb', 400, {
      verb: req.method,
      url: req._parsedUrl.href
    })

  }
}

const imageHeader = req => /^image/.test(req.headers.accept)

const redirections = {
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
}
// transactions: (id)->
