import error_ from '#lib/error/error'
import { unprefixify } from './lib/prefix.js'
import inv from './lib/update_inv_label.js'
import wd from './lib/update_wd_label.js'

const sanitization = {
  uri: { optional: true },
  id: { optional: true },
  lang: {},
  value: { type: 'string' }
}

const controller = async (params, req) => {
  let { uri, id, value, lang } = params

  const prefix = getPrefix(uri, id)
  const updater = updaters[prefix]

  if (uri) id = unprefixify(uri)

  if (value === '') throw error_.new('invalid value', 400, params)

  if (updater == null) {
    throw error_.new(`unsupported uri prefix: ${prefix}`, 400, params)
  }

  await updater(req.user, id, lang, value)
  return { ok: true }
}

const getPrefix = (uri, id) => {
  if (uri) return uri.split(':')[0]
  if (id) return 'inv'
}

const updaters = {
  inv,
  wd
}

export default { sanitization, controller }
