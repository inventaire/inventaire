import { newError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'
import { unprefixify } from './lib/prefix.js'
import inv from './lib/update_inv_label.js'
import wd from './lib/update_wd_label.js'

const sanitization = {
  uri: { optional: true },
  id: { optional: true },
  lang: {},
  value: { type: 'string' },
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  let { uri, id, value, lang } = params

  const prefix = getPrefix(uri, id)
  const updater = labelUpdatersByPrefix[prefix]

  if (uri) id = unprefixify(uri)

  if (value === '') throw newError('invalid value', 400, params)

  if (updater == null) {
    throw newError(`unsupported uri prefix: ${prefix}`, 400, params)
  }

  await updater(req.user, id, lang, value)
  return { ok: true }
}

function getPrefix (uri, id) {
  if (uri) return uri.split(':')[0]
  if (id) return 'inv'
}

export const labelUpdatersByPrefix = {
  inv,
  wd,
}

export default { sanitization, controller }
