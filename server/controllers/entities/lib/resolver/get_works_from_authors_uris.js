import _ from '#builders/utils'
import getAuthorWorks from '#controllers/entities/lib/get_author_works'
import getEntitiesList from '../get_entities_list.js'

export default authorUris => {
  return Promise.all(authorUris.map(getWorksFromAuthorsUri))
  .then(_.flatten)
}

const getWorksFromAuthorsUri = async authorUri => {
  const { works } = await getAuthorWorks({ uri: authorUri })
  const uris = _.map(works, 'uri')
  // Get full-fledged entity, as getAuthorWorks returns an entity without labels
  return getEntitiesList(uris)
}
