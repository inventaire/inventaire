import { isInvEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'
import { moveInvEntityToWikidata } from './lib/move_to_wikidata.js'

const sanitization = {
  uri: {},
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { uri } = params
  if (!isInvEntityUri(uri)) throw newError('Expected an inv entity uri', 400, { uri })
  return moveInvEntityToWikidata(req.user, uri)
}

export default {
  sanitization,
  controller,
  track: [ 'entity', 'moveToWikidata' ],
}
