const CONFIG = require('config')
const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const user_ = __.require('controllers', 'user/lib/user')
const couch_ = __.require('lib', 'couch')

module.exports = {
  get: (req, res) => {
    const params = customSanitize(req, res)
    const { resource } = params
    findUser(resource)
    .then(user => {
      if (!user) throw error_.new('unknown actor', 400, resource)
      const { username } = user
      res.json(formatWebfinger(username, resource))
    })
    .catch(error_.Handler(req, res))
  }
}

const customSanitize = (req, res) => {
  if (req.query.resource === null) {
    throw error_.new('missing parameter in query: resource', 400)
  }
  const { resource } = req.query
  if (!isValid(resource)) {
    throw error_.new('invalid resource', 400, resource)
  }
  return req.query
}

const isValid = resource => {
  assert_.string(resource)
  if (resource.startsWith('acct:') === false) return false
  const actorParts = getActorParts(resource)
  if (actorParts.length !== 2) return false

  const host = actorParts[1]
  return host === CONFIG.publicHost
}

const getActorParts = resource => {
  const actorWithHost = resource.substr(5)
  return actorWithHost.split('@')
}

const findUser = async resource => {
  const username = getActorParts(resource)[0]
  return user_.byUsername(username)
  .then(couch_.firstDoc)
}

const formatWebfinger = (username, resource) => {
  const publicHost = `${CONFIG.publicProtocol}://${CONFIG.publicHost}`
  const actorUrl = `${publicHost}/api/activitypub?action=actor&name=${username}`

  return {
    subject: resource,
    aliases: [ actorUrl ],
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actorUrl
      }
    ]
  }
}
