import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import { getInvEntityUriFromPatchId } from '#controllers/entities/lib/patches/patches'
import { lazyRefreshSnapshotFromUri } from '#controllers/items/lib/snapshot/refresh_snapshot'
import { updateEntitiesRevisionsCache } from '#lib/federation/entities_revisions_cache'
import { checkIfCriticalEntitiesWereRemoved } from '#lib/federation/recover_critical_entities'
import type { RelativeUrl, HttpMethod } from '#types/common'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

export async function runPostProxiedRequestHooks (method: HttpMethod, url: RelativeUrl, action: string, params: SanitizedParameters, res: unknown) {
  const endpoint = url.split('?')[0].split('/')[2]
  if (endpoint === 'entities') {
    if ((method === 'get' || method === 'post') && action === 'by-uris') {
      const { uris, refresh } = params
      if (refresh && uris) {
        uris.forEach(lazyRefreshSnapshotFromUri)
      }
      await checkIfCriticalEntitiesWereRemoved(res as GetEntitiesByUrisResponse)
      updateEntitiesRevisionsCache(res as GetEntitiesByUrisResponse)
    } else if (method === 'put') {
      const { uri, from, to, patch } = params
      if (uri) lazyRefreshSnapshotFromUri(uri)
      if (from) lazyRefreshSnapshotFromUri(from)
      if (to) lazyRefreshSnapshotFromUri(to)
      if (patch) lazyRefreshSnapshotFromUri(getInvEntityUriFromPatchId(patch))
    }
  }
}
