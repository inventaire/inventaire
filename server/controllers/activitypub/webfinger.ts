import { makeUrl, getEntityUriFromActorName, getEntityActorName } from '#controllers/activitypub/lib/helpers'
import { getEntityByUri } from '#controllers/entities/lib/federation/instance_agnostic_entities'
import { isEntityUri, isUsername } from '#lib/boolean_validations'
import { controllerWrapperFactory } from '#lib/controller_wrapper'
import { notFoundError } from '#lib/error/error'
import { memoryCachePublicController } from '#lib/memory_cache_public_controller'
import { publicHost } from '#server/config'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { validateUser, validateShelf } from './lib/validations.js'

const sanitization = {
  resource: {},
}

async function controller ({ resource }: SanitizedParameters) {
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
  throw notFoundError({ resource, name })
}

export default {
  get: controllerWrapperFactory({
    access: 'public',
    sanitization,
    // Caching the controller response to prevent an activity to trigger a fediverse DDoS
    controller: memoryCachePublicController<SanitizedParameters>({
      controller,
      getCacheKey: (params: SanitizedParameters) => `webfinger:${params.resource}`,
      cacheTtl: 30 * 1000,
    }),
  }),
}

function getActorName (resource) {
  const actorWithHost = resource.slice(5)
  return actorWithHost.split('@')[0]
}

function formatWebfinger (name) {
  const actorUrl = makeUrl({ params: { action: 'actor', name } })

  return {
    subject: `acct:${name}@${publicHost}`,
    aliases: [ actorUrl ],
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actorUrl,
      },
    ],
  }
}
