const { publicHost } = require('config')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { ControllerWrapper } = require('lib/controller_wrapper')
const makeUrl = require('controllers/activitypub/lib/make_url')

const sanitization = {
  resource: {}
}

const controller = async ({ resource }) => {
  const username = getActorParts(resource)[0]
  const user = await user_.findOneByUsername(username)
  if (!user) throw error_.new('not found', 404, resource)
  if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, resource)
  return formatWebfinger(user.stableUsername)
}

module.exports = {
  get: ControllerWrapper({
    access: 'public',
    sanitization,
    controller,
  })
}

const getActorParts = resource => {
  const actorWithHost = resource.substr(5)
  return actorWithHost.split('@')
}

const formatWebfinger = stableUsername => {
  const actorUrl = makeUrl({ params: { action: 'actor', name: stableUsername } })

  return {
    subject: `acct:${stableUsername}@${publicHost}`,
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
