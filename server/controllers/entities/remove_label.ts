import { labelUpdatersByPrefix } from '#controllers/entities/update_label'
import { newError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {
  uri: {},
  lang: {},
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { uri, lang } = params

  const [ prefix, id ] = uri.split(':')
  const updater = labelUpdatersByPrefix[prefix]

  if (updater == null) {
    throw newError(`unsupported uri prefix: ${prefix}`, 400, params)
  }

  await updater(req.user, id, lang, null)
  return { ok: true }
}

export default { sanitization, controller }
