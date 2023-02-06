import _ from '#builders/utils'
import { getEntitiesList } from '../get_entities_list.js'

export default workUris => {
  return getEntitiesList(workUris)
  .then(getAuthorUris)
  .then(_.flatten)
  .then(_.compact)
  .then(getEntitiesList)
}

const getAuthorUris = works => works.map(work => work.claims['wdt:P50'])
