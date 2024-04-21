import { flatten, map } from 'lodash-es'
import { getAuthorWorks } from '#controllers/entities/lib/get_author_works'
import { getEntitiesList } from '../get_entities_list.js'

export default authorUris => {
  return Promise.all(authorUris.map(getWorksFromAuthorsUri))
  .then(flatten)
}

async function getWorksFromAuthorsUri (authorUri) {
  const { works } = await getAuthorWorks({ uri: authorUri })
  const uris = map(works, 'uri')
  // Get full-fledged entity, as getAuthorWorks returns an entity without labels
  return getEntitiesList(uris)
}
