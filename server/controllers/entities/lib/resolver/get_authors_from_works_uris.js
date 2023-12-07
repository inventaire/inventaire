import { getWorksAuthorsUris } from '#controllers/entities/lib/entities'
import { getEntitiesList } from '../get_entities_list.js'

export async function getAuthorsFromWorksUris (workUris) {
  const works = await getEntitiesList(workUris)
  const authorsUris = getWorksAuthorsUris(works)
  return getEntitiesList(authorsUris)
}
