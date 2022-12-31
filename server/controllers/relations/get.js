import { getUserRelations, getNetworkIds } from 'controllers/user/lib/relations_status'

const sanitization = {}

const controller = async ({ reqUserId }) => {
  const [ relations, networkIds ] = await Promise.all([
    getUserRelations(reqUserId),
    getNetworkIds(reqUserId)
  ])
  delete relations.none
  relations.network = networkIds
  return relations
}

export default { sanitization, controller }
