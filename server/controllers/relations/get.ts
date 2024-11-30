import { getUserRelations } from '#controllers/relations/lib/lists'
import { getNetworkIds } from '#controllers/user/lib/relations_status'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {}

async function controller ({ reqUserId }: SanitizedParameters) {
  const [ relations, networkIds ] = await Promise.all([
    getUserRelations(reqUserId),
    getNetworkIds(reqUserId),
  ])
  delete relations.none
  relations.network = networkIds
  return relations
}

export default { sanitization, controller }
