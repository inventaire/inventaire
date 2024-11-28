import { flatten, map } from 'lodash-es'
import { getAuthorWorks } from '#controllers/entities/lib/get_author_works'
import type { EntityUri } from '#server/types/entity'
import { getEntitiesList } from '../get_entities_list.js'

export async function getWorksFromAuthorsUris (authorUris: EntityUri[]) {
  const works = await Promise.all(authorUris.map(getWorksFromAuthorsUri))
  return flatten(works)
}

async function getWorksFromAuthorsUri (authorUri: EntityUri) {
  const { works } = await getAuthorWorks({ uri: authorUri })
  const uris = map(works, 'uri')
  // Get full-fledged entity, as getAuthorWorks returns an entity without labels
  return getEntitiesList(uris)
}
