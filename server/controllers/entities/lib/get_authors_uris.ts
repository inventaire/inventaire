import { chain } from 'lodash-es'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'

export default work => {
  return chain(work.claims)
  .pick(workAuthorRelationsProperties)
  .values()
  .flatten()
  .uniq()
  .value()
}
