import { getUserRelations } from '#controllers/relations/lib/lists'
import { getNetworkIds } from '#controllers/user/lib/relations_status'

const sanitization = {}

async function controller ({ reqUserId }) {
  const [ relations, networkIds ] = await Promise.all([
    getUserRelations(reqUserId),
    getNetworkIds(reqUserId),
  ])
  delete relations.none
  relations.network = networkIds
  return relations
}

export default { sanitization, controller }
