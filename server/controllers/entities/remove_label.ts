import { labelUpdatersByPrefix } from '#controllers/entities/update_label'
import { newError } from '#lib/error/error'

const sanitization = {
  uri: {},
  lang: {},
}

async function controller (params, req) {
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
