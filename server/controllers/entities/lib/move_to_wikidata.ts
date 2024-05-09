import { getEntityById } from '#controllers/entities/lib/entities'
import { newError } from '#lib/error/error'
import { extendInvClaims } from '#models/entity'
import type { InvEntityUri } from '#server/types/entity'
import type { User } from '#server/types/user'
import { createWdEntity } from './create_wd_entity.js'
import mergeEntities from './merge_entities.js'
import { unprefixify } from './prefix.js'
import { cacheEntityRelations } from './temporarily_cache_relations.js'

export async function moveInvEntityToWikidata (user: User, invEntityUri: InvEntityUri) {
  const { _id: reqUserId } = user

  const entityId = unprefixify(invEntityUri)

  const entity = await getEntityById(entityId).catch(rewrite404(invEntityUri))

  if ('redirection' in entity) {
    throw newError('A redirection can not be moved to Wikidata', 400, { invEntityUri, entity })
  }
  if (entity.type === 'removed:placeholder') {
    throw newError('A removed placeholder can not be moved to Wikidata', 400, { invEntityUri, entity })
  }

  let claims, labels
  if ('labels' in entity) labels = entity.labels
  if ('claims' in entity) claims = extendInvClaims(entity.claims)

  const { uri: wdEntityUri } = await createWdEntity({ labels, claims, user, isAlreadyValidated: true })

  // Caching relations for some hours, as Wikidata Query Service can take some time to update,
  // at the very minimum some minutes, during which the data contributor might be confused
  // by the absence of the entity they just moved to Wikidata in lists generated with the help of the WQS
  await cacheEntityRelations(invEntityUri)

  await mergeEntities({
    userId: reqUserId,
    fromUri: invEntityUri,
    toUri: wdEntityUri,
    context: {
      action: 'move-to-wikidata',
    },
  })

  return { uri: wdEntityUri }
}

const rewrite404 = invEntityUri => err => {
  if (err.statusCode === 404) {
    throw newError('entity not found', 400, { invEntityUri })
  } else {
    throw err
  }
}
