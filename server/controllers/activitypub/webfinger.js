const { publicHost } = require('config')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { ControllerWrapper } = require('lib/controller_wrapper')
const makeUrl = require('controllers/activitypub/lib/make_url')
const { isEntityUri, isUsername } = require('lib/boolean_validations')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')

const sanitization = {
  resource: {}
}

const controller = async ({ resource }) => {
  const name = getActorName(resource)
  if (isEntityUri(name)) {
    const entity = await getEntityByUri({ uri: name })
    if (entity) return formatWebfinger(entity.uri)
  } else if (isUsername(name)) {
    const user = await user_.findOneByUsername(name)
    if (user.fediversable) return formatWebfinger(user.stableUsername)
  }
  throw error_.notFound({ resource, name })
}

module.exports = {
  get: ControllerWrapper({
    access: 'public',
    sanitization,
    controller,
  })
}

const getActorName = resource => {
  const actorWithHost = resource.substr(5)
  return actorWithHost.split('@')[0]
}

const formatWebfinger = name => {
  const actorUrl = makeUrl({ params: { action: 'actor', name } })

  return {
    subject: `acct:${name}@${publicHost}`,
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
