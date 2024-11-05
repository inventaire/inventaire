import { uniq } from 'lodash-es'
import { getInvEntitiesByClaims, type ClaimPropertyValueTuple } from '#controllers/entities/lib/entities'
import { prefixifyInv } from '#controllers/entities/lib/prefix'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import { getEntityNormalizedTerms } from '#controllers/entities/lib/terms_normalization'
import { mapDoc } from '#lib/couch'
import type { InvEntityId } from '#types/entity'

export async function getAuthorWorksData (authorId: InvEntityId) {
  const authorClaims = workAuthorRelationsProperties.map(property => [ property, `inv:${authorId}` ]) satisfies ClaimPropertyValueTuple[]
  const res = await getInvEntitiesByClaims(authorClaims)
  const works = mapDoc(res)
  // works = [
  //   { labels: { fr: 'Matiere et Memoire'} },
  //   { labels: { en: 'foo' } }
  // ]
  const labels = uniq(works.flatMap(getEntityNormalizedTerms))
  const langs = uniq(works.flatMap(getLangs))
  const worksUris = works.map(work => prefixifyInv(work._id))
  return { authorId, labels, langs, worksUris }
}

const getLangs = work => Object.keys(work.labels)
