import { chain } from 'lodash-es'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'

export default work => {
  return chain(work.claims)
  .pick(authorRelationsProperties)
  .values()
  .flatten()
  .uniq()
  .value()
}
