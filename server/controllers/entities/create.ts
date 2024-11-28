import { newError } from '#lib/error/error'
import { getLocalUserAcct } from '#lib/federation/remote_user'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'
import { createInvEntity } from './lib/create_inv_entity.js'
import { createWdEntity } from './lib/create_wd_entity.js'
import { getEntityByUri } from './lib/get_entity_by_uri.js'

const sanitization = {
  labels: {
    generic: 'object',
    default: {},
  },
  claims: {
    generic: 'object',
  },
  prefix: {
    allowlist: [ 'inv', 'wd' ],
    default: 'inv',
  },
}

async function controller (params, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  const { prefix, labels, claims, reqUserId } = params
  const createFn = creators[prefix]
  params = { labels, claims }
  if (prefix === 'wd') {
    if ('user' in req) {
      params.user = req.user
    } else {
      // TODO: allow remote users to get Wikidata OAuth tokens OR use botAccountWikidataOAuth
      throw newError('A remote user can not edit a Wikidata edition', 403)
    }
  } else {
    if ('user' in req) {
      params.userAcct = getLocalUserAcct(reqUserId)
    } else {
      params.userAcct = req.remoteUser.acct
    }
  }
  const entity = await createFn(params)
  // Re-request the entity's data to get it formatted
  return getEntityByUri({ uri: entity.uri, refresh: true })
}

const creators = {
  inv: createInvEntity,
  wd: createWdEntity,
}

export default {
  sanitization,
  controller,
  track: [ 'entity', 'creation' ],
}
