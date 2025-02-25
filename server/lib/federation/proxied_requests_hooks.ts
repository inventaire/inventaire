import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import { getInvEntityUriFromPatchId } from '#controllers/entities/lib/patches/patches'
import { updateEntitiesRevisionsCache } from '#lib/federation/entities_revisions_cache'
import { checkIfCriticalEntitiesWereRemoved } from '#lib/federation/recover_critical_entities'
import { emit } from '#lib/radio'
import { waitForSideEffects } from '#server/config'
import type { RelativeUrl, HttpMethod } from '#types/common'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { EntityUri } from '#types/entity'

export async function runPostProxiedRequestHooks (method: HttpMethod, url: RelativeUrl, action: string, params: SanitizedParameters, res: unknown) {
  const endpoint = url.split('?')[0].split('/')[2]
  if (endpoint === 'entities') {
    if ((method === 'get' || method === 'post') && action === 'by-uris') {
      await runPostGetEntitiesProxiedRequestHooks(res as GetEntitiesByUrisResponse)
    } else if (method === 'put') {
      const { uri, from, to, patch } = params
      if (uri) await triggerEntityChange(uri)
      if (from) await triggerEntityChange(from)
      if (to) await triggerEntityChange(to)
      if (patch) await triggerEntityChange(getInvEntityUriFromPatchId(patch))
    }
  }
}

async function runPostGetEntitiesProxiedRequestHooks (res: GetEntitiesByUrisResponse) {
  await checkIfCriticalEntitiesWereRemoved(res)
  if (waitForSideEffects) {
    await updateEntitiesRevisionsCache(res)
  } else {
    updateEntitiesRevisionsCache(res)
  }
}

async function triggerEntityChange (uri: EntityUri) {
  await emit('entity:changed', uri)
}
