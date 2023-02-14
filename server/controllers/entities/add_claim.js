import { claimUpdatersByPrefix } from '#controllers/entities/update_claim'
import { error_ } from '#lib/error/error'

const sanitization = {
  uri: {},
  property: {},
  value: {},
}

const controller = async (params, req) => {
  const { uri, property, value } = params
  const [ prefix, id ] = uri.split(':')

  const updater = claimUpdatersByPrefix[prefix]
  if (updater == null) {
    throw error_.new(`unsupported uri prefix: ${prefix}`, 400, uri)
  }

  await updater(req.user, id, property, null, value)
  return { ok: true }
}

export default { sanitization, controller }
