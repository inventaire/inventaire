import { compact, flatten } from 'lodash-es'
import { getEntitiesList } from '../get_entities_list.js'

export default workUris => {
  return getEntitiesList(workUris)
  .then(getAuthorUris)
  .then(flatten)
  .then(compact)
  .then(getEntitiesList)
}

const getAuthorUris = works => works.map(work => work.claims['wdt:P50'])
