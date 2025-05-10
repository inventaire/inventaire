import { parseReqLocalOrRemoteUser } from '#lib/federation/remote_user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'
import deduplicateWork from './lib/deduplicate_works.js'

const sanitization = {
  uri: {},
  isbn: {},
} as const

async function controller ({ uri, isbn }: SanitizedParameters, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  const user = parseReqLocalOrRemoteUser(req)
  const tasks = await deduplicateWork(uri, isbn, user)
  return {
    tasks: (tasks || []).flat(),
  }
}

export default { sanitization, controller }
