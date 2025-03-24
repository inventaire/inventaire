import { getUserRelations } from '#controllers/relations/lib/lists'
import { getNetworkIds } from '#controllers/user/lib/relations_status'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { UserId } from '#types/user'

interface UserRelations {
  friends: UserId[]
  userRequested: UserId[]
  otherRequested: UserId[]
  network: UserId[]
}

const sanitization = {}

async function controller ({ reqUserId }: SanitizedParameters) {
  const [ relations, networkIds ] = await Promise.all([
    getUserRelations(reqUserId),
    getNetworkIds(reqUserId),
  ])
  delete relations.none
  return { ...relations, network: networkIds } as UserRelations
}

export default { sanitization, controller }

export type GetRelationsResponse = Awaited<ReturnType<typeof controller>>
