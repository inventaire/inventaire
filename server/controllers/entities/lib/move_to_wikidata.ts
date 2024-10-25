import { omitBy, uniq } from 'lodash-es'
import { getEntityById } from '#controllers/entities/lib/entities'
import { getInvEntityType } from '#controllers/entities/lib/get_entity_type'
import { getPublicationYear } from '#controllers/entities/lib/get_publisher_publications'
import { expandInvClaims, getClaimValue, getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { resolveExternalIds } from '#controllers/entities/lib/resolver/resolve_external_ids'
import { getWikidataOAuthCredentials } from '#controllers/entities/lib/wikidata_oauth'
import { temporarilyOverrideWdIdAndIsbnCache } from '#data/wikidata/get_wd_entities_by_isbns'
import { isInvPropertyUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { logError } from '#lib/utils/logs'
import wdEdit from '#lib/wikidata/edit'
import { getOriginalLang } from '#lib/wikidata/get_original_lang'
import type { EntityValue, ExpandedClaims, InvEntityUri, WdEntityUri } from '#server/types/entity'
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
  if ('claims' in entity) claims = expandInvClaims(entity.claims)

  if (Object.keys(labels).length === 0) {
    const title = getFirstClaimValue(claims, 'wdt:P1476')
    const lang = getOriginalLang(claims)
    if (title && lang) {
      labels[lang] = title
    }
  }
  keepOnlyOneIsbnFormat(claims)

  const conflictingWdEntities = await resolveExternalIds(claims, {
    resolveOnWikidata: true,
    resolveLocally: false,
    refresh: true,
  })
  if (conflictingWdEntities?.length > 0) {
    throw newError('Can not move to Wikidata: some Wikidata entities share the same identifiers', 400, { conflicts: conflictingWdEntities })
  }

  // Local claims will be preserved in a local layer during merge
  const claimsWithoutLocalClaims = omitBy(claims, (propertyClaims, property) => isInvPropertyUri(property))
  const { uri: wdEntityUri } = await createWdEntity({
    labels,
    claims: claimsWithoutLocalClaims,
    user,
    isAlreadyValidated: true,
  })

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

  const isbn13h = getFirstClaimValue(claims, 'wdt:P212')
  if (isbn13h) await temporarilyOverrideWdIdAndIsbnCache(wdEntityUri, isbn13h)

  try {
    await setReverseClaims(claims, wdEntityUri, user)
  } catch (err) {
    // Setting reverse claims is a nice-to-have but not worth crashing the request if it fails
    logError(err, 'setReverseClaims failed')
  }

  return { uri: wdEntityUri }
}

const rewrite404 = invEntityUri => err => {
  if (err.statusCode === 404) {
    throw newError('entity not found', 400, { invEntityUri })
  } else {
    throw err
  }
}

function keepOnlyOneIsbnFormat (claims: ExpandedClaims) {
  const publicationYear = getPublicationYear(claims)
  if (publicationYear != null) {
    if (publicationYear >= 2007) {
      delete claims['wdt:P957']
    } else {
      delete claims['wdt:P212']
    }
  }
}

async function setReverseClaims (claims: ExpandedClaims, wdEntityUri: WdEntityUri, user: User) {
  const credentials = getWikidataOAuthCredentials(user)
  const entityType = getInvEntityType(claims['wdt:P31'])
  const newEntityId = unprefixify(wdEntityUri)
  if (entityType === 'edition') {
    for (const workClaim of uniq(claims['wdt:P629'])) {
      const workUri = getClaimValue(workClaim) as EntityValue
      const id = unprefixify(workUri)
      await wdEdit.claim.create({ id, property: 'P747', value: newEntityId }, { credentials })
    }
  }
}
