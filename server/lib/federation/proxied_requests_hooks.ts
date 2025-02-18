import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import { getInvEntityUriFromPatchId } from '#controllers/entities/lib/patches/patches'
import { lazyRefreshSnapshotFromUri } from '#controllers/items/lib/snapshot/refresh_snapshot'
import { updateEntitiesRevisionsCache } from '#lib/federation/entities_revisions_cache'
import { checkIfCriticalEntitiesWereRemoved } from '#lib/federation/recover_critical_entities'
import { waitForSideEffects } from '#server/config'
import type { RelativeUrl, HttpMethod } from '#types/common'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

export async function runPostProxiedRequestHooks (method: HttpMethod, url: RelativeUrl, action: string, params: SanitizedParameters, res: unknown) {
  const endpoint = url.split('?')[0].split('/')[2]
  if (endpoint === 'entities') {
    if ((method === 'get' || method === 'post') && action === 'by-uris') {
      await runPostGetEntitiesProxiedRequestHooks(res as GetEntitiesByUrisResponse, params)
    } else if (method === 'put') {
      const { uri, from, to, patch } = params
      if (uri) lazyRefreshSnapshotFromUri(uri)
      if (from) lazyRefreshSnapshotFromUri(from)
      if (to) lazyRefreshSnapshotFromUri(to)
      if (patch) lazyRefreshSnapshotFromUri(getInvEntityUriFromPatchId(patch))
    }
  }
}

async function runPostGetEntitiesProxiedRequestHooks (res: GetEntitiesByUrisResponse, params: SanitizedParameters) {
  const { uris, refresh } = params
  if (refresh && uris) {
    uris.forEach(lazyRefreshSnapshotFromUri)
  }
  await checkIfCriticalEntitiesWereRemoved(res)
  if (waitForSideEffects) {
    await updateEntitiesRevisionsCache(res)
  } else {
    updateEntitiesRevisionsCache(res)
  }
}
