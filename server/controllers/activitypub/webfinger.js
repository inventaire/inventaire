const origin = require('config').getPublicOrigin()
const publicHost = origin.split('://')[1]
const error_ = require('lib/error/error')
const { ControllerWrapper } = require('lib/controller_wrapper')
const { makeUrl, getEntityUriFromActorName, getEntityActorName } = require('controllers/activitypub/lib/helpers')
const { isEntityUri, isUsername } = require('lib/boolean_validations')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { validateUser, validateShelf } = require('./lib/validations')

const sanitization = {
  resource: {}
}

const controller = async ({ resource }) => {
  const name = getActorName(resource)
  if (isEntityUri(getEntityUriFromActorName(name))) {
    const entity = await getEntityByUri({ uri: getEntityUriFromActorName(name) })
    if (entity) return formatWebfinger(getEntityActorName(entity.uri))
  } else if (name.startsWith('shelf-')) {
    await validateShelf(name)
    return formatWebfinger(name)
  } else if (isUsername(name)) {
    const { user } = await validateUser(name)
    return formatWebfinger(user.stableUsername)
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
  const actorWithHost = resource.slice(5)
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
