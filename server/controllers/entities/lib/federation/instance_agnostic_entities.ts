import { getRemoteEntitiesByUris, getRemoteEntitiesList, getRemoteEntityByUri, getRemoteReverseClaims } from '#controllers/entities/lib/federation/get_remote_entities_by_uris'
import { getEntitiesByUris as getLocalEntitiesByUris, type GetEntitiesByUrisParams } from '#controllers/entities/lib/get_entities_by_uris'
import { getEntitiesList as getLocalEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { getEntityByUri as getLocalEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getReverseClaims as getLocalReverseClaims, type ReverseClaimsParams } from '#controllers/entities/lib/reverse_claims'
import { info } from '#lib/utils/logs'
import config, { federatedMode } from '#server/config'
import type { EntityUri } from '#types/entity'

if (federatedMode) info(config.federation, 'federated entities mode')

// TODO: pass down refresh/dry flags
export async function getEntitiesByUris ({ uris, refresh }: Pick<GetEntitiesByUrisParams, 'uris' | 'refresh'>) {
  if (federatedMode) {
    return getRemoteEntitiesByUris({ uris, refresh })
  } else {
    return getLocalEntitiesByUris({ uris, refresh })
  }
}

export async function getEntityByUri ({ uri, refresh }: { uri: EntityUri, refresh?: boolean }) {
  if (federatedMode) {
    return getRemoteEntityByUri({ uri, refresh })
  } else {
    return getLocalEntityByUri({ uri, refresh })
  }
}

export async function getEntitiesList (uris: EntityUri[], params?: Pick<GetEntitiesByUrisParams, 'refresh'>) {
  if (federatedMode) {
    return getRemoteEntitiesList(uris, params)
  } else {
    return getLocalEntitiesList(uris, params)
  }
}

export async function getReverseClaims (params: ReverseClaimsParams) {
  if (federatedMode) {
    return getRemoteReverseClaims(params)
  } else {
    return getLocalReverseClaims(params)
  }
}
