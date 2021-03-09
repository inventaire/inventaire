const _ = require('builders/utils')
const getAuthorWorks = require('controllers/entities/lib/get_author_works')
const getEntitiesList = require('../get_entities_list')

module.exports = authorUris => {
  return Promise.all(authorUris.map(getWorksFromAuthorsUri))
  .then(_.flatten)
}

const getWorksFromAuthorsUri = async authorUri => {
  const { works } = await getAuthorWorks({ uri: authorUri })
  const uris = _.map(works, 'uri')
  // Get full-fledged entity, as getAuthorWorks returns an entity without labels
  return getEntitiesList(uris)
}
