import { chain } from 'lodash-es'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties_per_type'

export default work => {
  return chain(work.claims)
  .pick(authorRelationsProperties)
  .values()
  .flatten()
  .uniq()
  .value()
}
